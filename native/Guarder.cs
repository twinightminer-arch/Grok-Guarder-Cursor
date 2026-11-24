using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

internal static class DesktopWindow
{
    internal delegate bool EnumProc(IntPtr window, IntPtr parameter);
    internal delegate void EventProc(IntPtr hook, uint kind, IntPtr window, int objectId, int child, uint thread, uint time);
    [DllImport("user32.dll")] internal static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] internal static extern IntPtr GetAncestor(IntPtr window, uint flags);
    [DllImport("user32.dll")] internal static extern bool EnumWindows(EnumProc proc, IntPtr parameter);
    [DllImport("user32.dll")] internal static extern bool IsWindowVisible(IntPtr window);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] internal static extern int GetWindowText(IntPtr window, StringBuilder value, int capacity);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] internal static extern int GetClassName(IntPtr window, StringBuilder value, int capacity);
    [DllImport("user32.dll")] internal static extern bool SetWindowPos(IntPtr window, IntPtr after, int x, int y, int w, int h, uint flags);
    [DllImport("user32.dll")] internal static extern IntPtr SetWinEventHook(uint min, uint max, IntPtr module, EventProc callback, uint process, uint thread, uint flags);
    [DllImport("user32.dll")] internal static extern bool UnhookWinEvent(IntPtr hook);
    [DllImport("user32.dll")] internal static extern bool IsWindow(IntPtr window);
    [DllImport("user32.dll")] internal static extern bool IsIconic(IntPtr window);
    [DllImport("user32.dll")] internal static extern uint GetWindowThreadProcessId(IntPtr window, out int process);
    [DllImport("user32.dll")] internal static extern bool GetClientRect(IntPtr window, out Rectangle rect);
    [DllImport("user32.dll")] internal static extern bool ClientToScreen(IntPtr window, ref Point point);
    [DllImport("user32.dll")] internal static extern uint GetDpiForWindow(IntPtr window);
    [DllImport("user32.dll")] internal static extern bool SetProcessDpiAwarenessContext(IntPtr context);

}

internal sealed class FloatingForm : Form
{
    private Rectangle lastBounds;
    private int lastRadius;

    public FloatingForm(string title)
    {
        Text = title;
        FormBorderStyle = FormBorderStyle.None;
        AutoScaleMode = AutoScaleMode.None;
        StartPosition = FormStartPosition.Manual;
        ShowInTaskbar = false;
        TopMost = true;
    }

    protected override CreateParams CreateParams
    {
        get
        {
            var options = base.CreateParams;
            options.ExStyle |= 0x80;
            return options;
        }
    }

    protected override bool ShowWithoutActivation { get { return true; } }

    public void Position(Rectangle bounds, int radius)
    {
        if (lastBounds == bounds && lastRadius == radius) return;
        bool resized = lastBounds.Size != bounds.Size || lastRadius != radius;
        lastBounds = bounds;
        lastRadius = radius;
        DesktopWindow.SetWindowPos(Handle, IntPtr.Zero, bounds.X, bounds.Y, bounds.Width, bounds.Height, 0x10);
        if (!resized) return;
        using (var shape = new System.Drawing.Drawing2D.GraphicsPath())
        {
            float diameter = Math.Min(radius * 2, Math.Min(Width, Height));
            shape.AddArc(0, 0, diameter, diameter, 180, 90);
            shape.AddArc(Width - diameter, 0, diameter, diameter, 270, 90);
            shape.AddArc(Width - diameter, Height - diameter, diameter, diameter, 0, 90);
            shape.AddArc(0, Height - diameter, diameter, diameter, 90, 90);
            shape.CloseFigure();
            Region = new Region(shape);
        }
    }


}

internal sealed class Guarder : ApplicationContext
{
    private const string LocalUrl = "https://guarder-panel.invalid/index.html";
    private const string GrokUrl = "https://grok.com/";
    private readonly JavaScriptSerializer json = new JavaScriptSerializer { MaxJsonLength = 12 * 1024 * 1024 };
    private FloatingForm panel;
    private FloatingForm visual;
    private readonly WebView2 content = new WebView2 { Dock = DockStyle.Fill, DefaultBackgroundColor = Color.FromArgb(71, 190, 230) };
    private readonly WebView2 site = new WebView2();
    private readonly Timer discovery = new Timer { Interval = 1200 };
    private readonly Dictionary<IntPtr, Point> launchers = new Dictionary<IntPtr, Point>();
    private readonly List<IntPtr> hooks = new List<IntPtr>();
    private readonly DesktopWindow.EventProc windowEvent;
    private readonly Image artwork;
    private readonly string assets;
    private readonly string browserRoot;
    private IntPtr owner;
    private bool expanded;
    private bool managed;
    private bool panelStarted;
    private bool siteStarted;
    private bool siteFailed;
    private Slot slot;
    private string latestState;

    public sealed class Slot
    {
        public int X { get; set; }
        public int Y { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
    }
    public sealed class Message
    {
        public string Type { get; set; }
        public Slot Geometry { get; set; }
        public bool Active { get; set; }
        public PanelState Data { get; set; }
    }
    public sealed class PanelState
    {
        public bool HostConnected { get; set; }
    }

    public Guarder(string assetFolder, string userDataFolder)
    {
        assets = assetFolder;
        browserRoot = userDataFolder;
        artwork = Image.FromFile(Path.Combine(assets, "grok.png"));
        System.Threading.SynchronizationContext.SetSynchronizationContext(new WindowsFormsSynchronizationContext());
        windowEvent = OnWindowEvent;
        Watch(0x0003, 0x0003); // Foreground
        Watch(0x000A, 0x000B); // Start/end moving and resizing
        Watch(0x0016, 0x0017); // Start/end minimizing
        Watch(0x8000, 0x8003); // Create/destroy/show/hide
        Watch(0x800B, 0x800B); // Location and size changes
        discovery.Tick += delegate { Discover(); };
        discovery.Start();
        Discover();
        ReadInput();
    }

    private void Watch(uint first, uint last)
    {
        var hook = DesktopWindow.SetWinEventHook(first, last, IntPtr.Zero, windowEvent, 0, 0, 2);
        if (hook != IntPtr.Zero) hooks.Add(hook); // Skip our process, callback runs on our UI thread.
    }

    private static bool IsCursor(IntPtr window)
    {
        if (window == IntPtr.Zero || !DesktopWindow.IsWindowVisible(window)) return false;
        var name = new StringBuilder(64);
        DesktopWindow.GetClassName(window, name, name.Capacity);
        if (!name.ToString().StartsWith("Chrome_WidgetWin_", StringComparison.Ordinal)) return false;
        var title = new StringBuilder(300);
        DesktopWindow.GetWindowText(window, title, title.Capacity);
        if (title.ToString().IndexOf("Cursor", StringComparison.OrdinalIgnoreCase) < 0) return false;
        int id;
        DesktopWindow.GetWindowThreadProcessId(window, out id);
        try
        {
            using (var process = Process.GetProcessById(id))
                return String.Equals(process.ProcessName, "Cursor", StringComparison.OrdinalIgnoreCase);
        }
        catch (ArgumentException) { return false; }
    }

    private void Discover()
    {
        var present = new HashSet<IntPtr>();
        DesktopWindow.EnumWindows((window, _) =>
        {
            if (IsCursor(window))
            {
                present.Add(window);
                if (!launchers.ContainsKey(window)) AddLauncher(window);
            }
            return true;
        }, IntPtr.Zero);
        foreach (var handle in new List<IntPtr>(launchers.Keys))
        {
            if (present.Contains(handle)) continue;
            launchers.Remove(handle);
        }
        PlacePanel();
        PlaceVisual();
    }

    private void OnWindowEvent(IntPtr hook, uint kind, IntPtr window, int objectId, int child, uint thread, uint time)
    {
        if (objectId != 0 || child != 0 || window == IntPtr.Zero) return;
        if (kind == 0x0003)
        {
            if (!launchers.ContainsKey(window) && IsCursor(window)) AddLauncher(window);
            PlacePanel();
            PlaceVisual();
            return;
        }
        if (launchers.ContainsKey(window))
        {
            if (kind == 0x8001)
            {
                launchers.Remove(window);
            }
            if (owner == window) PlacePanel();
            PlaceVisual();
        }
        else if ((kind == 0x8002 || kind == 0x0017) && IsCursor(window))
        {
            AddLauncher(window);
        }
    }

    private void AddLauncher(IntPtr host) { launchers[host] = Point.Empty; }

    private static int Pixels(IntPtr host, int dip)
    {
        return (int)Math.Round(dip * Math.Max(96, DesktopWindow.GetDpiForWindow(host)) / 96.0);
    }

    private Rectangle IconBounds(IntPtr host, Rectangle client)
    {
        var offset = launchers[host];
        int size = Pixels(host, 48);
        int inset = Pixels(host, 8);
        int x = Math.Max(inset, Math.Min(client.Width - size - inset, client.Width - size - Pixels(host, 22) + offset.X));
        int y = Math.Max(inset, Math.Min(client.Height - size - inset, client.Height - size - Pixels(host, 24) + offset.Y));
        return new Rectangle(x, y, size, size);
    }

    private void PlaceVisual()
    {
        var active = DesktopWindow.GetAncestor(DesktopWindow.GetForegroundWindow(), 2);
        if (visual != null && active == visual.Handle) active = visualOwner;
        if (panel != null && active == panel.Handle) active = owner;
        Rectangle client;
        var origin = new Point();
        if (managed || !launchers.ContainsKey(active) || DesktopWindow.IsIconic(active)
            || !DesktopWindow.GetClientRect(active, out client) || !DesktopWindow.ClientToScreen(active, ref origin))
        {
            if (visual != null) visual.Hide();
            return;
        }
        visualOwner = active;
        if (visual == null)
        {
            visual = new FloatingForm("Grok Guarder launcher");
            var icon = new PictureBox { Dock = DockStyle.Fill, SizeMode = PictureBoxSizeMode.StretchImage,
                Cursor = Cursors.Hand, Image = artwork };
            visual.Controls.Add(icon);
            Point start = Point.Empty, baseline = Point.Empty;
            bool dragging = false, moved = false;
            icon.MouseDown += delegate(object sender, MouseEventArgs args)
            {
                if (args.Button != MouseButtons.Left) return;
                dragging = true;
                moved = false;
                start = Cursor.Position;
                baseline = launchers[visualOwner];
                icon.Capture = true;
            };
            icon.MouseMove += delegate
            {
                if (!dragging || !launchers.ContainsKey(visualOwner)) return;
                var now = Cursor.Position;
                int x = now.X - start.X, y = now.Y - start.Y;
                if (!moved && Math.Abs(x) + Math.Abs(y) < 6) return;
                moved = true;
                launchers[visualOwner] = new Point(baseline.X + x, baseline.Y + y);
                PlaceVisual();
                if (owner == visualOwner) PlacePanel();
            };
            icon.MouseUp += delegate(object sender, MouseEventArgs args)
            {
                if (!dragging) return;
                dragging = false;
                icon.Capture = false;
                if (!moved && args.Button == MouseButtons.Left) SetExpanded(visualOwner, !expanded || owner != visualOwner);
            };
        }
        var bounds = IconBounds(active, client);
        bounds.Offset(origin);
        visual.Position(bounds, bounds.Width / 2);
        if (!visual.Visible) visual.Show();
    }

    private IntPtr visualOwner;

    private void UpdateAnchor(IntPtr host, Slot geometry)
    {
        Rectangle client;
        if (geometry == null || !launchers.ContainsKey(host) || !DesktopWindow.GetClientRect(host, out client)) return;
        launchers[host] = new Point(Pixels(host, geometry.X) - client.Width + Pixels(host, 70),
            Pixels(host, geometry.Y) - client.Height + Pixels(host, 72));
        if (owner == host) PlacePanel();
    }

    private void PlacePanel()
    {
        if (panel == null) return;
        var foreground = DesktopWindow.GetAncestor(DesktopWindow.GetForegroundWindow(), 2);
        Rectangle client;
        var origin = new Point();
        if (!expanded || !launchers.ContainsKey(owner) || DesktopWindow.IsIconic(owner)
            || (foreground != owner && foreground != panel.Handle && (visual == null || foreground != visual.Handle))
            || !DesktopWindow.GetClientRect(owner, out client) || !DesktopWindow.ClientToScreen(owner, ref origin))
        {
            panel.Hide();
            return;
        }
        var icon = IconBounds(owner, client);
        client.Location = origin;
        var clip = Rectangle.Intersect(client, Screen.FromHandle(owner).WorkingArea);
        int inset = Pixels(owner, 8);
        int width = Math.Max(160, Math.Min(Pixels(owner, 480), clip.Width - Pixels(owner, 32)));
        int height = Math.Max(140, Math.Min(Pixels(owner, 690), clip.Height - Pixels(owner, 112)));
        int left = Math.Max(clip.Left + inset, Math.Min(origin.X + icon.Right - width, clip.Right - width - inset));
        int above = origin.Y + icon.Top - Pixels(owner, 18) - height;
        int top = Math.Max(clip.Top + inset, Math.Min(above, clip.Bottom - height - inset));
        if (above < clip.Top + inset && origin.Y + icon.Bottom + Pixels(owner, 18) + height <= clip.Bottom - inset)
            top = origin.Y + icon.Bottom + Pixels(owner, 18);
        panel.Position(new Rectangle(left, top, width, height), Pixels(owner, 24));
        if (!panel.Visible) panel.Show();
        PositionSite();
    }

    private void SetExpanded(IntPtr host, bool value)
    {
        if (value && !launchers.ContainsKey(host)) return;
        if (value && panel == null)
        {
            panel = new FloatingForm("Grok Guarder");
            panel.BackColor = Color.FromArgb(71, 190, 230);
            panel.Controls.Add(content);
            panel.Controls.Add(site);
            site.Hide();
            panel.FormClosing += delegate(object sender, FormClosingEventArgs args)
            {
                if (args.CloseReason == CloseReason.UserClosing) { args.Cancel = true; SetExpanded(owner, false); }
            };
        }
        if (value) owner = host;
        expanded = value;
        PlacePanel();
        if (expanded && !panelStarted) InitializePanel();
    }

    private IntPtr ForegroundCursor()
    {
        var root = DesktopWindow.GetAncestor(DesktopWindow.GetForegroundWindow(), 2);
        if (panel != null && root == panel.Handle) return owner;
        if (visual != null && root == visual.Handle) return visualOwner;
        if (!launchers.ContainsKey(root) && IsCursor(root)) AddLauncher(root);
        return root;
    }
    private async void InitializePanel()
    {
        panelStarted = true;
        try
        {
            var environment = await CoreWebView2Environment.CreateAsync(null, browserRoot);
            await content.EnsureCoreWebView2Async(environment);
            var web = content.CoreWebView2;
            web.Settings.AreDevToolsEnabled = false;
            web.Settings.AreDefaultContextMenusEnabled = false;
            web.Settings.AreHostObjectsAllowed = false;
            web.SetVirtualHostNameToFolderMapping("guarder-panel.invalid", assets, CoreWebView2HostResourceAccessKind.Deny);
            web.NavigationStarting += delegate(object sender, CoreWebView2NavigationStartingEventArgs args) { args.Cancel = args.Uri != LocalUrl; };
            web.NewWindowRequested += delegate(object sender, CoreWebView2NewWindowRequestedEventArgs args) { args.Handled = true; };
            web.WebMessageReceived += PanelMessage;
            web.Navigate(LocalUrl);
        }
        catch (Exception error)
        {
            Console.Error.WriteLine("Floating panel initialization: " + error.Message);
            var warning = new Label { Dock = DockStyle.Fill, TextAlign = ContentAlignment.MiddleCenter,
                Text = "Grok Guarder\r\nMicrosoft Edge WebView2 Runtime is required." };
            panel.Controls.Add(warning);
            warning.BringToFront();
        }
    }

    private void PanelMessage(object sender, CoreWebView2WebMessageReceivedEventArgs args)
    {
        if (args.Source != LocalUrl) return;
        var raw = args.WebMessageAsJson;
        var message = json.Deserialize<Message>(raw);
        switch (message.Type)
        {
            case "close":
                SetExpanded(owner, false);
                break;
            case "slot":
                slot = message.Geometry;
                if (slot != null && !siteStarted) InitializeSite();
                PositionSite();
                break;
            case "ready":
                if (latestState != null) content.CoreWebView2.PostWebMessageAsJson(latestState);
                Console.WriteLine(raw);
                break;
            default:
                Console.WriteLine(raw);
                break;
        }
    }

    private async void InitializeSite()
    {
        siteStarted = true;
        try
        {
            await site.EnsureCoreWebView2Async(content.CoreWebView2.Environment);
            var browser = site.CoreWebView2;
            browser.Settings.IsWebMessageEnabled = false;
            browser.Settings.AreHostObjectsAllowed = false;
            browser.NavigationStarting += delegate(object sender, CoreWebView2NavigationStartingEventArgs args)
            {
                Uri uri;
                args.Cancel = !Uri.TryCreate(args.Uri, UriKind.Absolute, out uri)
                    || (uri.Scheme != "https" && uri.AbsoluteUri != "about:blank")
                    || uri.Host == "guarder-panel.invalid";
                if (!args.Cancel && IsGoogleAccountPage(uri))
                {
                    args.Cancel = true;
                    ReportBrowserSignIn();
                }
            };
            browser.NavigationCompleted += delegate(object sender, CoreWebView2NavigationCompletedEventArgs args)
            {
                if (!args.IsSuccess && args.WebErrorStatus != CoreWebView2WebErrorStatus.OperationCanceled)
                    ReportSiteFailure(args.WebErrorStatus.ToString());
            };
            browser.NewWindowRequested += delegate(object sender, CoreWebView2NewWindowRequestedEventArgs args)
            {
                args.Handled = true;
                Uri uri;
                if (!Uri.TryCreate(args.Uri, UriKind.Absolute, out uri) || uri.Scheme != "https") return;
                if (IsGoogleAccountPage(uri))
                {
                    ReportBrowserSignIn();
                    return;
                }
                if (args.IsUserInitiated)
                {
                    try { Process.Start(new ProcessStartInfo(uri.AbsoluteUri) { UseShellExecute = true }); }
                    catch (Exception error) { Console.Error.WriteLine(error.Message); }
                }
            };
            browser.Navigate(GrokUrl);
            PositionSite();
        }
        catch (Exception error) { ReportSiteFailure(error.Message); }
    }

    private static bool IsGoogleAccountPage(Uri uri)
    {
        return uri.Scheme == "https" && uri.IsDefaultPort && uri.UserInfo.Length == 0
            && String.Equals(uri.IdnHost, "accounts.google.com", StringComparison.OrdinalIgnoreCase);
    }

    private void ReportBrowserSignIn()
    {
        // Start from Grok in the system browser, so Grok creates the sign-in request in that browser session.
        content.CoreWebView2.PostWebMessageAsJson("{\"Type\":\"browserSignIn\"}");
    }

    private void ReportSiteFailure(string message)
    {
        siteFailed = true;
        site.Hide();
        content.CoreWebView2.PostWebMessageAsJson("{\"Type\":\"siteError\"}");
        Console.Error.WriteLine("Grok embedded browser: " + message);
    }

    private void PositionSite()
    {
        if (site.CoreWebView2 == null || slot == null || siteFailed)
        {
            site.Hide();
            return;
        }
        double scale = Math.Max(96, DesktopWindow.GetDpiForWindow(panel.Handle)) / 96.0;
        var bounds = Rectangle.Intersect(panel.ClientRectangle,
            new Rectangle((int)Math.Round(slot.X * scale), (int)Math.Round(slot.Y * scale),
                (int)Math.Round(slot.Width * scale), (int)Math.Round(slot.Height * scale)));
        if (bounds.Width < 120 || bounds.Height < 100) { site.Hide(); return; }
        site.Bounds = bounds;
        if (!site.Visible)
        {
            site.Show();
            site.BringToFront();
        }
    }

    private async void ReadInput()
    {
        while (true)
        {
            string raw = await Task.Run(() => Console.ReadLine());
            if (raw == null) { ExitThread(); return; }
            try
            {
                var message = json.Deserialize<Message>(raw);
                switch (message.Type)
                {
                    case "focus": Discover(); break;
                    case "toggle":
                        var host = ForegroundCursor();
                        SetExpanded(host, !expanded || owner != host);
                        break;
                    case "show": SetExpanded(ForegroundCursor(), true); break;
                    case "managed":
                        managed = message.Active;
                        PlaceVisual();
                        break;
                    case "domMove": UpdateAnchor(ForegroundCursor(), message.Geometry); break;
                    case "domToggle":
                        var cursor = ForegroundCursor();
                        UpdateAnchor(cursor, message.Geometry);
                        SetExpanded(cursor, !expanded || owner != cursor);
                        break;
                    case "quit": ExitThread(); return;
                    case "state":
                        latestState = raw;
                        if (message.Data != null && managed != message.Data.HostConnected)
                        {
                            managed = message.Data.HostConnected;
                            PlaceVisual();
                        }
                        if (content.CoreWebView2 != null) content.CoreWebView2.PostWebMessageAsJson(raw);
                        break;
                    default:
                        if (content.CoreWebView2 != null) content.CoreWebView2.PostWebMessageAsJson(raw);
                        break;
                }
            }
            catch (Exception error) { Console.Error.WriteLine(error.Message); }
        }
    }

    protected override void ExitThreadCore()
    {
        discovery.Stop();
        discovery.Dispose();
        foreach (var hook in hooks) DesktopWindow.UnhookWinEvent(hook);
        if (visual != null) visual.Dispose();
        if (panel != null) panel.Dispose();
        artwork.Dispose();
        base.ExitThreadCore();
    }

    [STAThread]
    private static void Main(string[] args)
    {
        if (args.Length != 2) return;
        var utf8 = new UTF8Encoding(false);
        Console.SetIn(new StreamReader(Console.OpenStandardInput(), utf8));
        Console.SetOut(new StreamWriter(Console.OpenStandardOutput(), utf8) { AutoFlush = true });
        Console.SetError(new StreamWriter(Console.OpenStandardError(), utf8) { AutoFlush = true });
        DesktopWindow.SetProcessDpiAwarenessContext(new IntPtr(-4));
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new Guarder(args[0], args[1]));
    }
}
