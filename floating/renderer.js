function installGuarder(payload, validateDestination) {
  if (globalThis.guarder) return globalThis.guarder.snapshot();
  const deny = 'style,script,code,pre,.monaco-editor,.xterm,[contenteditable],textarea,[data-lexical-editor],iframe,webview,[data-testid="conversation-view"],[data-testid="conversation-row-sidebar"],[data-testid="agent-response"],[data-testid="user-message"],[data-testid="builtin-browser-webview-pool"],[data-testid="breadcrumb-segment"]';
  const settingsScope='.settings-modal-container [data-testid="settings-sidebar"],.settings-modal-container [data-split-fill-edge="left"]';
  const allow = '[data-testid="sidebar-navigation-items"] a[href="/customizations"],[data-testid="title-menu-bar-item"],[data-testid="section-header"],[data-testid="sidebar-add-project-button"],[data-testid="new-conversation-button"],[data-testid="automations-button"],[data-testid="settings-button"],[data-testid="sidebar-toggle"],[data-testid="sidebar-search-button"],[data-testid="app-icon-new-conversation-button"],[data-testid="toggle-aux-sidebar"],[data-testid="toggle-overview-panel"],[data-testid="titlebar-more-actions"],[data-testid="settings-sidebar"] [data-testid^="settings-nav-item-"],[data-testid="settings-app-version-caption"],[data-testid="settings-error-messages-copy-button"],[data-testid="settings-upload-debug-bundle-button"]';
  const composerControls='[data-testid="model-selector-trigger"],[data-testid="permissions-selector-trigger"],.agy-scroll-bottom,.surface-composer-card p.pointer-events-none.text-foreground';
  const reviewControl='[data-testid="changed-files-card-review"]';
  const sideScope='[data-testid="aux-pane-split"] > :has([data-testid="side-panel-new-tab-button"],[data-testid="side-panel-new-tab-view"],[data-testid="browser-url-input"],[data-testid^="aux-terminal-split-"],[data-testid^="review-changes-section-"])';
  const scope=sideScope+','+reviewControl+','+allow+','+composerControls+',.agy-home .home-greeting-title,[data-testid="project-selector-trigger"]'+',[data-testid="title-menu-bar-option"]'+','+settingsScope;
  const settingsData='[data-testid="settings-nav-item-Account"],[data-testid^="settings-nav-item-swarm/"]:not([data-testid="settings-nav-item-swarm/swarm_board"]),[data-testid="builtin-browser-download-dir-value"],[role="textbox"],[data-testid="background-task-row"],[data-testid="file-title-name"],[data-testid="changed-file-row"]';
  const attrs = ['title','placeholder','aria-label','data-tooltip-content'];
  const popupControls='.settings-modal-container [aria-controls][aria-expanded="true"]';
  const excluded=deny+','+settingsData;
  let popupGroups=[];
  let composerSurfaces=[],hostSurfaces=[];
  const dict = new Map(payload.dictionary.map(([key,...values])=>[key,values]));
  const translated = new Map();
  const commands = [];
  let config = payload.config;
  let stopped = false;
  let pending = false;
  let open = true;
  let data = payload.data;
  const overlay = document.createElement('div');
  overlay.id = 'guarder-antigravity-overlay';
  document.body.append(overlay);
  const root = overlay.attachShadow({mode:'open'});
  const style = document.createElement('style');
  style.textContent = payload.css;
  root.append(style);
  const add = (parent,tag,text) => {
    const node=document.createElement(tag);
    if(text!==undefined) node.textContent=text;
    parent.append(node);
    return node;
  };
  const launcher=add(root,'button');
  launcher.type='button';launcher.className='launcher';launcher.title='Guarder';launcher.setAttribute('aria-label','Guarder');
  const mark=add(launcher,'img');mark.alt='';mark.src=payload.icon;
  mark.addEventListener('error',()=>{mark.remove();launcher.classList.add('fallback');launcher.textContent='G';},{once:true});
  let drag;
  let suppressClick=false;
  launcher.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    const rect=launcher.getBoundingClientRect();
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,right:innerWidth-rect.right,bottom:innerHeight-rect.bottom,moved:false};
    suppressClick=false;
    launcher.setPointerCapture(event.pointerId);
  });
  launcher.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(!drag.moved&&Math.hypot(dx,dy)<5)return;
    drag.moved=true;
    const right=Math.max(8,Math.min(innerWidth-56,drag.right-dx));
    const bottom=Math.max(8,Math.min(innerHeight-56,drag.bottom-dy));
    launcher.style.right=right+'px';
    launcher.style.bottom=bottom+'px';
    panel.style.right=Math.min(right,Math.max(8,innerWidth-panel.offsetWidth-8))+'px';
  });
  const finishDrag=event=>{
    if(drag?.id!==event.pointerId)return;
    suppressClick=drag.moved;
    drag=undefined;
  };
  launcher.addEventListener('pointerup',finishDrag);
  launcher.addEventListener('pointercancel',finishDrag);
  launcher.addEventListener('click',()=>{
    if(suppressClick){suppressClick=false;return;}
    open=!open;render();
  });
  const panel=add(root,'section');
  panel.className='panel';panel.setAttribute('aria-label',"Grok Guarder");
  let browserSignInRequired=false;
  const browserSignInCopy={
    'zh-CN':['Google 账号请在系统浏览器登录。','请在系统浏览器用 Google 账号登录，并在该浏览器中继续使用 Grok。','面板暂时无法加载 Grok，可以在系统浏览器打开。'],
    'zh-TW':['請在系統瀏覽器使用 Google 帳號登入。','請在系統瀏覽器使用 Google 帳號登入，並在該瀏覽器中繼續使用 Grok。','面板暫時無法載入 Grok，可以在系統瀏覽器開啟。'],
    en:['Use your default browser to sign in with Google.','Sign in with Google in your default browser and continue using Grok there.','Grok could not load in the panel. You can open it in your default browser.'],
    ja:['Google アカウントでのログインには既定のブラウザーを使ってください。','既定のブラウザーで Google アカウントにログインし、そのブラウザーで Grok を使い続けてください。','パネルで Grok を読み込めませんでした。既定のブラウザーで開くことができます。'],
    ko:['Google 계정으로 로그인하려면 기본 브라우저를 사용하세요.','기본 브라우저에서 Google 계정으로 로그인한 뒤 해당 브라우저에서 Grok을 계속 사용하세요.','패널에서 Grok을 불러올 수 없습니다. 기본 브라우저에서 열 수 있습니다.'],
  };
  let siteUnavailable=false;
  let activeTab='home',wallpaperSearch='',vocabSearch='',category='all',sort='title',favoritesOnly=false;
  let paused=false;
  let hoverCard,previewSequence=0;
  const posters=new Map(),posterElements=new Map();
  const destinationDrafts=new Map();
  const colorChoices={fontColor:'#ffffff',composerBackgroundColor:'#ffffff'};
  const themeStyle=document.createElement('style');
  document.head.append(themeStyle);
  const backdrop=document.createElement('div');
  backdrop.id='guarder-antigravity-wallpaper';backdrop.setAttribute('aria-hidden','true');
  let backdropUrl;
  let backdropHost;
  let titlebar, titlebarMedia, titlebarFrame, lastTitlebarSample=-Infinity, titlebarColors;
  const sampleCanvas=document.createElement('canvas');
  sampleCanvas.width=40;
  sampleCanvas.height=4;
  const sampleContext=sampleCanvas.getContext('2d',{willReadFrequently:true});
  const titlebarSelector='#root [data-testid="title-menu-bar"]';
  const toLinear=channel=>{const value=channel/255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4;};
  const luminance=([r,g,b])=>.2126*toLinear(r)+.7152*toLinear(g)+.0722*toLinear(b);
  const rgb=channels=>'rgb('+channels.map(Math.round).join(' ')+')';
  let toolbarRoot,nativeCaption;
  function notifyCaption(value){
    const message=JSON.stringify(value);
    if(message===nativeCaption||!globalThis.guarderCaptionChanged)return;
    nativeCaption=message;
    globalThis.guarderCaptionChanged(message);
  }
  function resetTitlebar(){
    toolbarRoot?.style.removeProperty('--guarder-toolbar-paint');
    toolbarRoot?.style.removeProperty('--guarder-toolbar-ink');
    toolbarRoot=undefined;
    if(titlebarFrame!==undefined)titlebarMedia?.cancelVideoFrameCallback?.(titlebarFrame);
    titlebarFrame=undefined;
    titlebarMedia=undefined;
    titlebarColors=undefined;
    lastTitlebarSample=-Infinity;
    titlebar?.removeAttribute('data-guarder-titlebar');
    titlebar?.style.removeProperty('--guarder-titlebar-paint');
    titlebar?.style.removeProperty('--guarder-titlebar-ink');
    titlebar=undefined;
  }
  function setTitlebar(element,paint,ink,toolbarPaint=paint){
    if(titlebar!==element&&titlebar){
      titlebar.removeAttribute('data-guarder-titlebar');
      titlebar.style.removeProperty('--guarder-titlebar-paint');
      titlebar.style.removeProperty('--guarder-titlebar-ink');
    }
    titlebar=element;
    if(!titlebar.hasAttribute('data-guarder-titlebar'))titlebar.setAttribute('data-guarder-titlebar','');
    if(titlebar.style.getPropertyValue('--guarder-titlebar-paint')!==paint)titlebar.style.setProperty('--guarder-titlebar-paint',paint);
    if(titlebar.style.getPropertyValue('--guarder-titlebar-ink')!==ink)titlebar.style.setProperty('--guarder-titlebar-ink',ink);
    toolbarRoot=element.closest('#root');
    if(toolbarRoot?.style.getPropertyValue('--guarder-toolbar-paint')!==toolbarPaint)toolbarRoot?.style.setProperty('--guarder-toolbar-paint',toolbarPaint);
    if(toolbarRoot?.style.getPropertyValue('--guarder-toolbar-ink')!==ink)toolbarRoot?.style.setProperty('--guarder-toolbar-ink',ink);
    const color=toolbarPaint.startsWith('#')?toolbarPaint:'#'+toolbarPaint.match(/\d+/g).map(value=>Number(value).toString(16).padStart(2,'0')).join('');
    notifyCaption({color,symbolColor:ink});
  }
  function sampleTitlebar(media,bar){
    const width=media.videoWidth||media.naturalWidth;
    const height=media.videoHeight||media.naturalHeight;
    const area=bar.getBoundingClientRect(), source=media.getBoundingClientRect();
    if(!sampleContext||!width||!height||!area.width||!area.height||!source.width||!source.height)return;
    const cover=Math.max(source.width/width,source.height/height);
    // Map the displayed cover crop into a small strip matching the visible title bar.
    const top=Math.min(Math.max(area.top,source.top),Math.max(source.top,source.bottom-area.height));
    const scaleX=sampleCanvas.width/area.width, scaleY=sampleCanvas.height/area.height;
    sampleContext.clearRect(0,0,sampleCanvas.width,sampleCanvas.height);
    sampleContext.drawImage(media,
      (source.left+(source.width-width*cover)/2-area.left)*scaleX,
      (source.top+(source.height-height*cover)/2-top)*scaleY,
      width*cover*scaleX,height*cover*scaleY);
    const pixels=sampleContext.getImageData(0,0,sampleCanvas.width,sampleCanvas.height).data;
    const stops=[];
    for(let band=0;band<8;band++){
      const sum=[0,0,0];let count=0;
      for(let y=0;y<4;y++)for(let x=band*5;x<band*5+5;x++){
        const offset=(y*40+x)*4;
        if(pixels[offset+3]<128)continue;
        for(let channel=0;channel<3;channel++)sum[channel]+=pixels[offset+channel];
        count++;
      }
      stops.push(count?sum.map(channel=>channel/count):null);
    }
    const first=stops.find(Boolean);
    if(!first)return;
    const colors=stops.map((value,index)=>{
      const current=value??stops.slice(0,index).reverse().find(Boolean)??first;
      return titlebarColors?current.map((channel,i)=>.75*channel+.25*titlebarColors[index][i]):current;
    });
    titlebarColors=colors;
    const light=colors.reduce((sum,color)=>sum+luminance(color),0)/colors.length>.25;
    const contrastStops=colors.map(color=>{
      // Maintain readable caption contrast across dark and bright sections of one frame.
      for(let step=0;step<20&&(light?luminance(color)<.19:luminance(color)>.17);step++){
        color=color.map(channel=>channel*.87+(light?255*.13:0));
      }
      return rgb(color);
    });
    setTitlebar(bar,'linear-gradient(90deg, '+contrastStops.join(', ')+')',light?'#000000':'#ffffff',contrastStops.at(-1));
  }
  function syncTitlebar(theme,force=false){
    const bar=document.querySelector(titlebarSelector);
    const media=backdrop.firstElementChild;
    if(!bar||theme.titlebarMode==='system'){
      if(titlebar||titlebarMedia)resetTitlebar();
      if(nativeCaption)notifyCaption(null);
      return;
    }
    if(theme.titlebarMode==='custom'){
      if(titlebarMedia)resetTitlebar();
      const color=theme.titlebarColor;
      const channels=color.slice(1).match(/../g).map(pair=>parseInt(pair,16));
      setTitlebar(bar,color,luminance(channels)>.179?'#000000':'#ffffff');
      return;
    }
    if(!media){if(titlebar||titlebarMedia)resetTitlebar();if(nativeCaption)notifyCaption(null);return;}
    const changed=titlebarMedia!==media;
    if(changed){resetTitlebar();titlebarMedia=media;}
    const draw=()=>{
      try{const current=document.querySelector(titlebarSelector);if(current)sampleTitlebar(media,current);}
      catch{resetTitlebar();if(nativeCaption)notifyCaption(null);}
    };
    if(changed||force||!titlebar)draw();
    if(titlebarMedia!==media||titlebarFrame!==undefined||!(media instanceof HTMLVideoElement))return;
    titlebarFrame=media.requestVideoFrameCallback(function frame(now){
      titlebarFrame=undefined;
      if(titlebarMedia!==media)return;
      if(now-lastTitlebarSample>=66){
        lastTitlebarSample=now;
        draw();
      }
      if(titlebarMedia===media)titlebarFrame=media.requestVideoFrameCallback(frame);
    });
  }
  let titlebarTheme;
  const refreshTitlebar=()=>{if(titlebarTheme)syncTitlebar(titlebarTheme,true);};
  window.addEventListener('resize',refreshTitlebar);
  const wallpaperScale=zoom=>1+(zoom-35)/100;
  const labels=['简体中文','繁體中文','English','日本語','한국어'];
  const languages=['zh-CN','zh-TW','en','ja','ko'];
  const saveLabels=['保存选中文本','儲存選取文字','Save selection','選択範囲を保存','선택 영역 저장'];
  const wallpaperOff=['关闭壁纸','關閉桌布','Turn off wallpaper','壁紙をオフ','배경 끄기'];

  const selectionMenu=add(root,'div');selectionMenu.className='selection-menu';selectionMenu.hidden=true;
  const selectionNotice=add(root,'div');selectionNotice.className='selection-notice';selectionNotice.hidden=true;
  selectionNotice.setAttribute('role','status');
  const selectionEvents=new AbortController();
  let selectedText='',noticeTimer,importFile,selectionAnchor;
  const t=key=>payload.panel[config.language]?.[key]||key;

  function notice(text){
    selectionNotice.textContent=text;selectionNotice.hidden=false;
    clearTimeout(noticeTimer);
    noticeTimer=setTimeout(()=>{selectionNotice.hidden=true;},4000);
  }
  async function copyTranslation(text){
    const index=languages.indexOf(config.language);
    await navigator.clipboard.writeText('Translate into '+labels[index]+' ('+config.language+').\n\n'+text);
    open=true;activeTab='home';render();notice(t('pastePrompt'));
  }
  const maxImportBytes=1024**3;
  function queueImport(file){
    if(!file||importFile)return;
    if(!file.size){notice(t('操作失败'));return;}
    if(file.size>maxImportBytes){notice(t('导入大小限制'));return;}
    importFile=file;
    notice(t('正在导入壁纸'));
    commands.push({type:'import',name:file.name,size:file.size});
  }
  panel.addEventListener('dragover',event=>{
    if(event.dataTransfer?.types.includes('Files'))event.preventDefault();
  });
  panel.addEventListener('drop',event=>{
    if(!event.dataTransfer?.files.length)return;
    event.preventDefault();
    if(event.isTrusted)queueImport(event.dataTransfer.files[0]);
  });
  function positionSelectionMenu(){
    if(selectionMenu.hidden||!selectionAnchor)return;
    const {range,x}=selectionAnchor;
    const {width,height}=selectionMenu.getBoundingClientRect();
    const margin=8,gap=30;
    const left=Math.max(margin,Math.min(innerWidth-width-margin,x-width/2));
    const topLimit=Math.max(margin,innerHeight-height-margin);
    const occupied=[...document.querySelectorAll('.agy-overlay,[role="tooltip"],[data-hover-card-popup],.selection-quote-popup')].map(e=>e.getBoundingClientRect()).filter(r=>r.width&&r.height);
    occupied.push(range);
    const overlaps=(x,y)=>occupied.some(r=>x<r.right+margin&&x+width>r.left-margin&&y<r.bottom+margin&&y+height>r.top-margin);
    const outside=[
      [left,range.bottom+gap],[left,range.top-height-gap],
      [margin,topLimit],[innerWidth-width-margin,topLimit],
      [margin,margin],[innerWidth-width-margin,margin]
    ];
    const best=outside.find(([x,y])=>x>=margin&&y>=margin&&y<=topLimit&&!overlaps(x,y));
    if(!best){selectionMenu.hidden=true;return;}
    selectionMenu.style.left=best[0]+'px';
    selectionMenu.style.top=best[1]+'px';
  }
  function showSelection(event){
    if(!event.isTrusted||event.composedPath().includes(overlay)||event.target.closest?.('input,textarea,[contenteditable],.monaco-editor,.xterm'))return;
    const selection=window.getSelection();
    const text=selection?.toString().trim();
    if(!text||text.length>1500||!selection.rangeCount){selectionMenu.hidden=true;return;}
    const range=selection.getRangeAt(0).getBoundingClientRect();
    selectedText=text;
    selectionAnchor={range,x:event.clientX};
    selectionMenu.hidden=false;
    positionSelectionMenu();
  }
  document.addEventListener('pointerup',showSelection,{signal:selectionEvents.signal});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')selectionMenu.hidden=true;},{signal:selectionEvents.signal});
  document.addEventListener('selectionchange',()=>{if(window.getSelection()?.isCollapsed)selectionMenu.hidden=true;},{signal:selectionEvents.signal});
  window.addEventListener('scroll',()=>{selectionMenu.hidden=true;},{capture:true,signal:selectionEvents.signal});
  window.addEventListener('resize',positionSelectionMenu,{signal:selectionEvents.signal});
  for(const [key,action] of [
    ['划词翻译',copyTranslation],
    ['加入生词本',text=>{commands.push({type:'save',text});}],
    ['复制选中文本',async text=>{await navigator.clipboard.writeText(text);notice(t('已复制'));}],
    ['Google 搜索',text=>{commands.push({type:'searchSelection',text});}]
  ]){
    const control=add(selectionMenu,'button');control.type='button';control.dataset.label=key;
    control.addEventListener('pointerdown',event=>event.preventDefault());
    control.addEventListener('click',async event=>{
      if(!event.isTrusted||!selectedText)return;
      selectionMenu.hidden=true;
      try{await action(selectedText);}
      catch{notice(t('操作失败'));}
    });
  }

  function safe(element) {
    return element instanceof Element && (element.closest(composerControls+','+reviewControl)||!element.closest(excluded)) && (Boolean(element.closest(scope))||popupGroups.some(group=>group.contains(element)));
  }
  function value(node,key) {return key ? node.getAttribute(key) : node.data;}
  function write(node,key,text) {if(key) node.setAttribute(key,text);else node.data=text;}
  const shortcutLabels=[
    [(name,key)=>name+' 快捷键 '+key,(name,key)=>'移除 '+name+' 的快捷键 '+key,name=>'添加 '+name+' 的快捷键'],
    [(name,key)=>name+' 快速鍵 '+key,(name,key)=>'移除 '+name+' 的快速鍵 '+key,name=>'新增 '+name+' 的快速鍵'],
    [(name,key)=>name+' のショートカット '+key,(name,key)=>name+' のショートカット '+key+' を削除',name=>name+' のショートカットを追加'],
    [(name,key)=>name+' 단축키 '+key,(name,key)=>name+' 단축키 '+key+' 삭제',name=>name+' 단축키 추가']
  ];
  function shortcutLabel(node,key,original,index){
    if(key!=='aria-label'||!node.closest('[data-testid^="shortcut-row-"]'))return;
    const match=original.match(/^(Shortcut |Remove shortcut )(.+?) for (.+)$/);
    const add=original.match(/^Add shortcut for (.+)$/);
    const name=dict.get(match?.[3]||add?.[1])?.[index];
    if(!name)return;
    return match?shortcutLabels[index][match[1]==='Shortcut '?0:1](name,match[2]):shortcutLabels[index][2](name);
  }
  function field(node,key) {
    const element=node.nodeType===3?node.parentElement:node;
    const project=element?.closest('[data-testid="project-selector-item"]');
    if(project&&(project.dataset.projectName!=='swarm/swarm_board'||key||node.data.trim()!=='swarm/swarm_board'))return;
    if(element?.closest('[data-testid="workspace-customizations-view"]')&&!element.closest('h3'))return;
    const original=value(node,key);
    if(!original) return;
    const lookup=original.trim();
    const index={ 'zh-CN':0,'zh-TW':1,ja:2,ko:3 }[config.language];
    let replacement;
    if(config.sync&&index!==undefined){
      replacement=dict.get(lookup)?.[index]||shortcutLabel(node,key,lookup,index);
      if(!replacement&&!key&&element?.matches('.agy-home .home-greeting-title')){
        const greeting=/^(Welcome back|Good to see you), (.+)\. (Where should we pick up\?|What's next\?)$/.exec(lookup);
        if(greeting){
          const template=greeting[1]+', {name}. '+greeting[3];
          replacement=dict.get(template)?.[index]?.replace('{name}',()=>greeting[2]);
        }
      }
      if(!replacement&&(element?.closest(composerControls)||composerSurfaces.some(surface=>surface.contains(element)))){
        const model=/^(.+) \((Thinking|Medium)\)$/.exec(lookup);
        const usage=/^(\d+%) left$/.exec(lookup);
        if(model)replacement=model[1]+' ('+dict.get(model[2])[index]+')';
        if(usage)replacement=dict.get('% left')[index].replace('%',usage[1]);
        for(const prefix of ['Select model, current:','Agent permissions preset selector, current:']){
          if(lookup.startsWith(prefix)){
            const current=lookup.slice(prefix.length).trim();
            const model=/^(.+) \((Thinking|Medium)\)$/.exec(current);
            replacement=dict.get(prefix)[index]+' '+(dict.get(current)?.[index]??(model?model[1]+' ('+dict.get(model[2])[index]+')':current));
          }
        }
      }
    }
    if(!replacement) return;
    const next=original.replace(lookup,()=>replacement);
    if(next===original) return;
    if(!translated.has(node)) translated.set(node,new Map());
    translated.get(node).set(key,{original,next});
    write(node,key,next);
  }
  function scan() {
    pending=false;
    if(stopped) return;
    if(data.media&&!backdrop.isConnected)syncWallpaper(data.theme);
    popupGroups=[...document.querySelectorAll(popupControls)].flatMap(control=>
      control.getAttribute('aria-controls').split(/\s+/).map(id=>document.getElementById(id))
    ).filter(node=>node?.matches('[role="listbox"],[role="menu"]')&&node.parentElement?.classList.contains('agy-overlay'));
    observer.disconnect();
    try {
      const sidePortals=[];
      for(const pane of document.querySelectorAll(sideScope)){
        for(const trigger of pane.querySelectorAll('[aria-expanded="true"][aria-controls]')){
          const menu=document.getElementById(trigger.getAttribute('aria-controls'));
          if(menu?.matches('.agy-overlay[role="menu"],.agy-overlay [role="listbox"]')){
            popupGroups.push(menu);
            if(!trigger.closest('[data-testid="agent-input-box"]'))sidePortals.push(menu.closest('.agy-overlay'));
          }
        }
      }
      const menus=[...document.querySelectorAll('[data-testid="agent-input-box"] [aria-controls][aria-expanded="true"],[data-testid="project-selector-trigger"][aria-controls][aria-expanded="true"], [data-testid="titlebar-more-actions"][aria-controls][aria-expanded="true"]')].map(control=>
        document.getElementById(control.getAttribute('aria-controls'))
      ).filter(node=>node?.matches('[role="menu"].agy-overlay'));
      const owners=new Set(menus.map(menu=>menu.getAttribute('data-rootownerid')).filter(Boolean));
      const submenus=[...document.querySelectorAll('[role="menu"].agy-overlay[data-rootownerid]')].filter(menu=>
        !menus.includes(menu)&&owners.has(menu.getAttribute('data-rootownerid'))
      );
      const modelBadgeHovered=Boolean(document.querySelector('[data-testid="model-selector-item"] [data-tooltip-id]:hover'));
      const tips=[...document.querySelectorAll('.compact-tooltip[role="tooltip"]')].filter(node=>{
        const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
        let label;
        do{label=walker.nextNode();}while(label&&!label.data.trim());
        const original=translated.get(label)?.get(null)?.original??label?.textContent;
        return modelBadgeHovered||['Select Model','Select Project','Toggle Overview Panel','Toggle Side Panel','Settings','Scroll to Bottom','Local Permissions','Select Permissions','Agent Permissions'].includes(original?.trim())||
          /^(?:Grok|Claude|GPT-OSS) .+? is currently available to /.test(node.textContent.trim());
      });
      for(const surface of composerSurfaces)surface.removeAttribute('data-guarder-composer-surface');
      composerSurfaces=[...menus,...submenus,...tips];
      for(const surface of composerSurfaces)surface.setAttribute('data-guarder-composer-surface','');
      popupGroups.push(...composerSurfaces);
      for(const surface of hostSurfaces)surface.removeAttribute('data-guarder-host-surface');
      const sideOwners=new Set(sidePortals.map(menu=>menu.getAttribute('data-rootownerid')).filter(Boolean));
      hostSurfaces=[...new Set([...sidePortals,...[...document.querySelectorAll('.agy-overlay[role="menu"][data-rootownerid]')].filter(menu=>sideOwners.has(menu.getAttribute('data-rootownerid')))])];
      for(const input of document.querySelectorAll('.agy-fastpick input[placeholder]')){
        const label=translated.get(input)?.get('placeholder')?.original??input.placeholder;
        if(label==='Search for commands...')hostSurfaces.push(input.closest('.agy-fastpick'));
      }
      for(const dialog of document.querySelectorAll('.agy-dialog[role="dialog"]')){
        const title=dialog.querySelector('h1,h2,[data-slot="dialog-title"]')?.firstChild;
        const label=translated.get(title)?.get(null)?.original??title?.textContent;
        if(['Create Project','Command Palette'].includes(label?.trim()))hostSurfaces.push(dialog);
      }
      for(const surface of hostSurfaces)surface.setAttribute('data-guarder-host-surface','');
      popupGroups.push(...hostSurfaces);
      for(const [node,fields] of translated) {
        if(node.isConnected) {
          for(const [key,pair] of fields) if(value(node,key)===pair.next) write(node,key,pair.original);
        }
      }
      translated.clear();
      if(!config.sync||config.language==='en') return;
      for(const group of [...document.querySelectorAll(scope),...popupGroups]) {
        if(!safe(group)||group.parentElement?.closest(scope)) continue;
        const walker=document.createTreeWalker(group,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{
          acceptNode(node){
            if(node.nodeType===1 && node.matches(excluded)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        });
        for(let node=group;node;node=walker.nextNode()) {
          if(node.nodeType===3) field(node,null);
          else for(const attr of attrs) field(node,attr);
        }
      }
    } finally {observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:[...attrs,'aria-expanded','aria-controls']});}
  }
  function schedule(){if(!pending&&!stopped){pending=true;queueMicrotask(scan);}}
  const observer=new MutationObserver(records=>{
    if(!selectionMenu.hidden&&records.some(({target,addedNodes})=>{
      const node=target.nodeType===1?target:target.parentElement;
      const popup='.agy-overlay,[role="tooltip"],[data-hover-card-popup],.selection-quote-popup';
      return node?.closest(popup)||[...addedNodes].some(e=>e.nodeType===1&&(e.matches(popup)||e.querySelector(popup)));
    }))positionSelectionMenu();
    if(data.media&&!backdrop.isConnected&&records.some(record=>record.type==='childList'))schedule();
    if(records.some(({target,addedNodes,removedNodes})=>{
      const node=target.nodeType===3?target.parentElement:target;
      if(safe(node)||node?.closest?.(composerControls+',.compact-tooltip[role=tooltip]')) return true;
      return [...addedNodes,...removedNodes].some(item=>item.nodeType===1 && (item.matches(scope+',.agy-overlay,.compact-tooltip,.agy-dialog,.agy-fastpick,[data-hover-card-popup]')||item.querySelector(scope+',.agy-overlay,.compact-tooltip,.agy-dialog,.agy-fastpick,[data-hover-card-popup]')));
    })) schedule();
  });
  function update(change) {
    config={...config,...change};
    if(change.theme)data={...data,theme:{...data.theme,...change.theme}};
    commands.push({type:'config',change});
    scan();
    render();
  }
  function saveSelection() {
    const text=window.getSelection()?.toString().trim();
    if(text&&text.length<=1500) commands.push({type:'save',text});
  }
  function handleKey(event) {
    if(event.altKey && event.shiftKey && event.code==='KeyG'){event.preventDefault();globalThis.guarderClose?.();}
    if(event.isTrusted && event.altKey && event.shiftKey && event.code==='KeyV'){event.preventDefault();saveSelection();}
  }
  window.addEventListener('keydown',handleKey);
  function syncWallpaper(theme) {
    const zoomChanged=titlebarTheme?.zoom!==theme.zoom;
    titlebarTheme=theme;
    const asset=data.media;
    const host=asset?document.querySelector('body > #root'):null;
    if(!host){
      backdropHost=undefined;backdrop.remove();
      backdrop.replaceChildren();backdropUrl=undefined;
      syncTitlebar(theme);
      return;
    }
    if(backdropHost!==host||!backdrop.isConnected){
      backdropHost=host;
      host.prepend(backdrop);
    }
    if(backdropUrl!==asset.url){
      backdropUrl=asset.url;
      const media=document.createElement(asset.type.startsWith('video/')?'video':'img');
      if(media instanceof HTMLVideoElement){media.loop=true;media.muted=true;media.playsInline=true;media.autoplay=!paused;}
      else media.alt='';
      media.crossOrigin='anonymous';
      media.addEventListener(media instanceof HTMLVideoElement?'loadeddata':'load',refreshTitlebar,{once:true});
      media.src=asset.url;
      backdrop.replaceChildren(media);
    }
    backdrop.style.setProperty('--guarder-scale',String(wallpaperScale(theme.zoom)));
    backdrop.style.setProperty('--guarder-blur',theme.blurPx+'px');
    const video=backdrop.querySelector('video');
    if(video){video.volume=theme.volume;video.muted=theme.volume===0;}
    syncTitlebar(theme,zoomChanged);
  }
  function themeAppearance(theme) {
    panel.style.setProperty('--guarder-preview-scale',String(wallpaperScale(theme.zoom)));
    panel.style.setProperty('--guarder-preview-blur',theme.blurPx+'px');
    const rules=[
      titlebarSelector+'[data-guarder-titlebar]{background:var(--guarder-titlebar-paint)!important}',
      titlebarSelector+'[data-guarder-titlebar] [data-testid="title-menu-bar-item"]{color:var(--guarder-titlebar-ink)}',
      '#root:has([data-guarder-titlebar]) :is([data-testid="app-update-button"],[data-testid="titlebar-more-actions"],[data-testid="toggle-overview-panel"],[data-testid="toggle-aux-sidebar"]){background:var(--guarder-toolbar-paint)!important;color:var(--guarder-toolbar-ink)!important}',
      '#root:has([data-guarder-titlebar]) :is([data-testid="app-update-button"],[data-testid="titlebar-more-actions"],[data-testid="toggle-overview-panel"],[data-testid="toggle-aux-sidebar"]):is(:hover,:focus-visible,[aria-expanded="true"],[aria-pressed="true"]){background:color-mix(in srgb,var(--guarder-toolbar-paint) 80%,var(--guarder-toolbar-ink))!important}'
    ];
    if(theme.titlebarMode==='system')rules.length=0;
    if(data.media||data.selected){
      // The sticky wrapper and its heading sit on the shared sidebar surface.
      rules.push('#root [data-testid="sidebar-split"] :is(.bg-sidebar:has(> [data-testid="section-header"]),[data-testid="section-header"],[data-testid="section-header"] > div){background:transparent!important}');
    }
    if(data.media){
      rules.push('#root:has(> #guarder-antigravity-wallpaper){isolation:isolate} #root .agy-shell,#root .agy-inset-shell,#root .agy-shell .flex-1.min-h-0.flex.flex-col:has([data-testid="overview-panel-host"],.agy-home){background-color:transparent!important}');
      // Scope the fade to the empty, non-interactive layer beside the transcript scroller.
      rules.push('#root [data-testid="conversation-view"] .relative.self-stretch.flex-grow.min-h-0 > .absolute.bottom-0.pointer-events-none[style*="linear-gradient(to top, var(--background), transparent)"][style*="--overview-panel-reserve"][style*="--conversation-nav-reserve"]:empty{background-image:none!important}');
      rules.push('#root [data-testid="conversation-row-sidebar"] .agy-row-actions::before{background:var(--background)!important}');
      rules.push('#root div:has(> [data-testid="right-cluster-fade"]):has(> [data-testid="toggle-aux-sidebar"]){background:transparent!important} #root [data-testid="right-cluster-fade"]{background:none!important}');
      const sidebar='#root [data-testid="sidebar-split"] .bg-sidebar:has([data-testid="sidebar-navigation-items"])';
      rules.push(sidebar+'{background-color:color-mix(in srgb,var(--sidebar) '+(theme.sidebarOpacity*100)+'%,transparent)!important}');
      rules.push(sidebar+' [data-testid="new-conversation-button"]{background-color:transparent!important}');
      rules.push(sidebar+' :is([data-testid="new-conversation-button"]:hover,[data-testid="conversation-row-sidebar"].bg-sidebar-secondary){background-color:color-mix(in srgb,currentColor 12%,transparent)!important}');
      rules.push('#guarder-antigravity-wallpaper{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:-1}');
      rules.push('#guarder-antigravity-wallpaper img,#guarder-antigravity-wallpaper video{width:100%;height:100%;object-fit:cover;filter:blur(var(--guarder-blur));transform:scale(var(--guarder-scale))}');
      rules.push('#root [data-testid="user-message"] [data-testid="user-message-bubble"]{background:var(--background)!important;color:var(--foreground)}');
      const conversation='#root [data-testid="overview-panel-host"]:has([data-testid="conversation-view"])';
      rules.push(conversation+'{background-color:rgb(0 0 0 / '+theme.scrimOpacity+');background-image:linear-gradient(var(--guarder-transcript-surface),var(--guarder-transcript-surface));--guarder-transcript-surface:rgb(255 255 255 / '+theme.opacity+')}');
      rules.push('body.theme-dark '+conversation+'{--guarder-transcript-surface:rgb(24 32 44 / '+theme.opacity+')}');
    }
    if(/^#[a-f0-9]{6}$/i.test(theme.fontColor||'')&&data.media){
      rules.push('#root :is([data-testid="conversation-view"],.settings-modal-container){color:'+theme.fontColor+';--foreground:'+theme.fontColor+'}');
    }
    if((data.media||data.selected)&&/^#[a-f0-9]{6}$/i.test(theme.composerBackgroundColor||'')){
      const color=theme.composerBackgroundColor;
      const [r,g,b]=color.slice(1).match(/../g).map(pair=>{
        const value=parseInt(pair,16)/255;
        return value<=.04045?value/12.92:((value+.055)/1.055)**2.4;
      });
      const ink=.2126*r+.7152*g+.0722*b>.179?'#000000':'#ffffff';
      const composer='#root [data-testid="agent-input-box"] .surface-composer';
      const surface='#root :is(.agy-overlay.surface-glass,.agy-dialog,.agy-fastpick,.compact-tooltip,.agy-scroll-bottom,.selection-quote-popup > .agy-selection-pill):not([data-guarder-host-surface],[data-hover-card-popup]),[data-guarder-composer-surface]';
      const palette='--background:'+color+';--card:'+color+';--sidebar:'+color+';--foreground:'+ink+';--muted-foreground:'+ink+';--secondary-foreground:'+ink+';--secondary:color-mix(in srgb,'+color+' 88%,'+ink+');--muted:var(--secondary);--sidebar-muted:var(--secondary);--border:color-mix(in srgb,'+ink+' 20%,'+color+');color:'+ink;
      rules.push(':is('+composer+','+surface+'){'+palette+';border-color:var(--border)!important}');
      rules.push(composer+'{background:var(--border)!important}');
      rules.push(composer+' > .surface-composer-card,:is('+surface+'),#root .settings-modal-container :is(.bg-background.text-foreground,[data-testid="settings-sidebar"]){background:'+color+'!important;backdrop-filter:none!important}');
      rules.push(':is('+composer+','+surface+') :is(.text-foreground,.text-muted-foreground,.text-secondary-foreground){color:'+ink+'!important}');
      rules.push(':is('+surface+') :is([role="menuitem"],[role="option"]):is(:hover,[data-highlighted]){background-color:var(--secondary)!important}');
    }
    if(data.media||data.selected){
      rules.push(sideScope+', '+sideScope+' [data-testid="side-panel-new-tab-view"]{background:var(--background)!important;color:var(--foreground)}');
      rules.push('[data-testid="title-menu-bar"] :has(> [data-testid="title-menu-bar-option"]),[data-guarder-host-surface],.agy-overlay[data-hover-card-popup]{background:var(--background)!important;color:var(--foreground)!important}');
    }
    const stylesheet=rules.join('\n');
    if(themeStyle.textContent!==stylesheet)themeStyle.textContent=stylesheet;
    syncWallpaper(theme);

  }
  function sendPreviewRequest(request){
    if(globalThis.guarderPreviewRequested)globalThis.guarderPreviewRequested(JSON.stringify(request));
    else commands.push(request);
  }
  function posterReady(id,url){
    posters.set(id,url);
    const image=posterElements.get(id);
    if(image?.isConnected&&url)image.src=url;
  }
  function requestPreview(id,slot,convert=false){
    hoverCard={id,slot,sequence:++previewSequence,pending:true};
    slot.replaceChildren();
    add(slot,'small',t('正在准备壁纸'));
    const request={type:'preview',id,sequence:previewSequence,convert};
    sendPreviewRequest(request);
  }
  function previewReady(request,asset){
    if(!hoverCard||request.sequence!==hoverCard.sequence||!hoverCard.slot.isConnected)return;
    const {slot,id}=hoverCard;
    hoverCard.pending=false;
    slot.replaceChildren();
    if(!asset){add(slot,'small',t('previewError'));return;}
    const video=asset.type.startsWith('video/');
    const media=add(slot,video?'video':'img');
    media.className='wallpaper-preview';
    if(video){media.muted=true;media.autoplay=true;media.loop=true;media.playsInline=true;}
    else media.alt='';
    media.addEventListener('error',()=>{
      if(!slot.isConnected||hoverCard?.sequence!==request.sequence)return;
      if(asset.canConvert&&!request.convert)requestPreview(id,slot,true);
      else slot.replaceChildren(document.createTextNode(t('previewError')));
    },{once:true});
    media.src=asset.url;
  }
  function dockGeometry() {
    const node=root.querySelector('.grok-native');
    if(!open||activeTab!=='home'||!node)return null;
    const r=node.getBoundingClientRect();
    if(r.width<150||r.height<120)return null;
    return {ScreenX:screenX,ScreenY:screenY,Viewport:innerWidth,X:Math.round(r.x),Y:Math.round(r.y),Width:Math.round(r.width),Height:Math.round(r.height)};
  }
  const syncNames=['同步词条','同步詞條','Copy entries','単語をコピー','항목 복사'];
  const copiedNames=['已复制','已複製','Copied','コピーしました','복사했습니다'];
  function formatEntries(name){
    const line=value=>String(value||'').replace(/[\r\n]+/g,' ');
    const pipe=value=>line(value).replaceAll('|','\\|');
    if(name==='obsidian')return '# GPT Salad\n\n'+data.entries.map(entry=>'- **'+line(entry.source_text)+'** — '+line(entry.notes)).join('\n');
    const rows=data.entries.map(entry=>'| '+pipe(entry.source_text)+' | '+pipe(entry.notes)+' | '+(entry.favorite?'★':'')+' |');
    return '| Entry | Notes | ★ |\n| --- | --- | --- |\n'+rows.join('\n');
  }
  let lastDockPayload;
  function notifyDockGeometry() {
    const payload=JSON.stringify(dockGeometry());
    if(payload===lastDockPayload||!globalThis.guarderDockChanged)return;
    lastDockPayload=payload;
    globalThis.guarderDockChanged(payload);
  }
  function render() {
    posterElements.clear();
    for(const button of selectionMenu.children)button.textContent=t(button.dataset.label);
    if(hoverCard&&(!open||activeTab!=='library')){hoverCard.slot.replaceChildren();hoverCard=undefined;}
    panel.hidden=!open;
    if(open&&launcher.style.right){
      panel.style.right=Math.min(parseFloat(launcher.style.right),Math.max(8,innerWidth-panel.offsetWidth-8))+'px';
    }
    launcher.setAttribute('aria-expanded',String(open));
    if(!open){notifyDockGeometry();themeAppearance(data.theme);return;}
    const index=languages.indexOf(config.language);
    const button=(parent,label,handler,css='')=>{
      const node=add(parent,'button',label);
      node.type='button';node.className=css;node.addEventListener('click',handler);
      return node;
    };
    const preview=(parent,asset=data.media,isTheme=false)=>{
      if(!asset)return;
      const wrap=add(parent,'div');
      if(isTheme)wrap.className='theme-preview';
      const error=add(parent,'p',t('previewError'));error.hidden=true;
      const media=add(wrap,asset.type.startsWith('video/')?'video':'img');
      media.className='wallpaper-preview';
      if(media instanceof HTMLVideoElement){media.muted=true;media.autoplay=!isTheme||!paused;media.loop=true;media.playsInline=true;media.preload='auto';}
      else media.alt='';
      media.addEventListener('error',()=>{error.hidden=false;},{once:true});
      media.src=asset.url;
      if(isTheme&&media instanceof HTMLVideoElement&&paused){
        media.addEventListener('loadeddata',()=>{const current=backdrop.querySelector('video')?.currentTime;if(current)media.currentTime=current;},{once:true});
      }
    };
    const keepSelection=node=>node.addEventListener('pointerdown',event=>event.preventDefault());
    const scrollTop=panel.querySelector('.body')?.scrollTop;
    const focused=root.activeElement;
    const focusKey=focused?.dataset.setting||focused?.dataset.destination;
    const destinationCaret=focused?.dataset.destination&&[focused.selectionStart,focused.selectionEnd];
    panel.replaceChildren();
    const color=(config.pageColor===null?null:config.pageColor||data.pageColor)||'#47bee6';
    const rgb=color.slice(1).match(/../g).map(x=>parseInt(x,16));
    const light=(0.299*rgb[0]+0.587*rgb[1]+0.114*rgb[2])>145;
    panel.toggleAttribute('data-ui-light',light);
    for(const [name,value] of Object.entries({
      bg:color,ink:light?'#16324c':'#eff5fc',muted:light?'#214461':'#b9c7d6',
      card:light?'#ffffffa8':'#182a3d',button:light?'#ffffffb8':'#254058',
      border:light?'#173e6040':'#ffffff30'
    })) panel.style.setProperty('--ui-'+name,value);
    const header=add(panel,'div');header.className='head';
    const heading=add(header,'div');
    add(heading,'strong',"Grok Guarder");
    add(heading,'small',t('壁纸 · 划词翻译 · 本地生词本'));
    const close=button(header,'✕',()=>{globalThis.guarderClose?.();},'icon');
    close.title=t('关闭面板');close.setAttribute('aria-label',close.title);
    const tabs=add(panel,'nav');tabs.className='tabs';
    const body=add(panel,'div');body.className='body';
    for(const [key,title] of [['home','Grok'],['library',t('壁纸库')],['vocabulary',t('生词本')],['theme',t('主题')],['settings',t('设置')]]) {
      const tab=button(tabs,title,()=>{activeTab=key;render();root.querySelector('[data-tab="'+key+'"]').focus();},activeTab===key?'active':'');
      tab.dataset.tab=key;tab.setAttribute('aria-pressed',String(activeTab===key));
    }
    const view=add(body,'div');view.className='view';view.dataset.view=activeTab;view.dataset.ready='';
    if(activeTab==='home'){
      const slot=add(view,'div');slot.className='grok-slot';
      slot.toggleAttribute('data-unavailable',siteUnavailable);
      const native=add(slot,'div');native.className='grok-native';native.hidden=siteUnavailable;
      const fallback=add(slot,'div');fallback.className='actions grok-fallback';
      const [prompt, help, unavailable]=browserSignInCopy[config.language]||browserSignInCopy.en;
      const status=add(fallback,'p',siteUnavailable?unavailable:browserSignInRequired?help:prompt);
      status.setAttribute('role','status');
      button(fallback,t('externalGrok'),()=>globalThis.guarderExternal?.());
    }
    if(activeTab==='library'){
      add(view,'h2',t('Wallpaper Engine 与本地壁纸库'));
      const filters=add(view,'div');filters.className='filters';
      const search=add(filters,'input');search.type='search';search.placeholder=t('搜索标题或标签');search.value=wallpaperSearch;
      const categorySelect=add(filters,'select');categorySelect.setAttribute('aria-label',t('壁纸库'));
      for(const [value,label] of [['all','全部'],['video','可应用视频'],['local','本地导入'],['other','其他']]){
        const option=add(categorySelect,'option',t(label));option.value=value;
      }
      categorySelect.value=category;
      const filterRow=add(view,'div');filterRow.className='filter-row';
      const favoriteLabel=add(filterRow,'label');
      const favoriteToggle=add(favoriteLabel,'input');favoriteToggle.type='checkbox';favoriteToggle.checked=favoritesOnly;
      favoriteLabel.append(' '+t('仅收藏'));
      const sortSelect=add(filterRow,'select');sortSelect.setAttribute('aria-label',t('按名称'));
      for(const [value,label] of [['title','按名称'],['size','按大小']]){
        const option=add(sortSelect,'option',t(label));option.value=value;
      }
      sortSelect.value=sort;
      const list=add(view,'div');list.className='list';
      const draw=()=>{
        list.replaceChildren();
        posterElements.clear();
        let count=0;
        const favorites=new Set(config.favorites);
        const rows=[...data.wallpapers].sort((a,b)=>(sort==='size'?b.size-a.size:0)||a.title.localeCompare(b.title,config.language));
        for(const item of rows){
          if(favoritesOnly&&!favorites.has(item.id))continue;
          if(category==='local'&&!item.local||category==='video'&&!item.video||category==='other'&&(item.local||item.video))continue;
          if(![item.title,...item.tags].some(label=>String(label).toLowerCase().includes(wallpaperSearch.toLowerCase())))continue;
          count++;
          const card=add(list,'article');card.className='card'+(item.id===data.selected?' active':'');
          const thumb=add(card,'div');thumb.className='library-thumb';
          const image=add(thumb,'img');image.alt='';image.decoding='async';
          posterElements.set(item.id,image);
          if(posters.get(item.id))image.src=posters.get(item.id);
          if(item.unsupported)add(thumb,'span',t('无预览')).className='library-no-preview';
          if(!item.unsupported&&!posters.has(item.id)){
            posters.set(item.id,null);
            sendPreviewRequest({type:'preview',id:item.id,poster:true});
          }
          const details=add(card,'div');details.className='library-card-details';
          const title=add(details,'div',item.title);title.className='card-title';
          add(details,'small',`${item.unsupported?t('暂不可应用'):item.video?'native-video':'native-image'} · ${(item.size/1048576).toFixed(1)} MB`);
          if(item.video){
            const current=hoverCard?.id===item.id;
            const slot=current?hoverCard.slot:add(thumb,'div');
            if(current)thumb.append(slot);
            slot.className='card-preview-slot';slot.hidden=!current;
            const request=()=>{
              if(hoverCard?.slot===slot&&(hoverCard.pending||slot.querySelector('video,img')))return;
              if(hoverCard?.slot&&hoverCard.slot!==slot){hoverCard.slot.replaceChildren();hoverCard.slot.hidden=true;}
              slot.hidden=false;
              requestPreview(item.id,slot);
            };
            button(thumb,'▶',request,'thumb-play').setAttribute('aria-label',t('预览视频'));
            card.addEventListener('pointerenter',request);
            card.addEventListener('pointerleave',()=>{
              if(hoverCard?.slot!==slot)return;
              hoverCard=undefined;
              slot.replaceChildren();slot.hidden=true;
            });
          }
          const favorite=button(details,favorites.has(item.id)?'★':'☆',()=>{
            config.favorites=favorites.has(item.id)?config.favorites.filter(id=>id!==item.id):[...favorites,item.id];
            commands.push({type:'config',change:{favorite:item.id}});draw();
          },'star');
          favorite.setAttribute('aria-label',t(favorites.has(item.id)?'取消收藏':'收藏'));
          favorite.setAttribute('aria-pressed',String(favorites.has(item.id)));
          button(details,t(item.unsupported?'暂不可应用':'应用'),()=>update({wallpaper:item.id}),'apply-button').disabled=item.unsupported||item.id===data.selected;
        }
        if(!count)add(list,'p',t('没有符合条件的壁纸。'));
      };
      categorySelect.addEventListener('change',()=>{category=categorySelect.value;draw();});
      sortSelect.addEventListener('change',()=>{sort=sortSelect.value;draw();});
      favoriteToggle.addEventListener('change',()=>{favoritesOnly=favoriteToggle.checked;draw();});
      search.addEventListener('input',()=>{wallpaperSearch=search.value;draw();});draw();
    }
    if(activeTab==='vocabulary'){
      const heading=add(view,'h2');heading.className='vocab-title';
      if(payload.vocabIcon){const icon=add(heading,'img');icon.className='vocab-logo';icon.src=payload.vocabIcon;icon.alt='';}
      heading.append(t('我的生词本'));
      const filters=add(view,'div');filters.className='filters';
      const search=add(filters,'input');search.type='search';search.placeholder=t('搜索词条');search.value=vocabSearch;
      button(filters,t('刷新词条'),()=>commands.push({type:'refresh'}),'save');
      keepSelection(button(view,saveLabels[index],event=>{if(event.isTrusted)saveSelection();},'save'));
      const list=add(view,'div');
      const draw=()=>{
        list.replaceChildren();
        const rows=data.entries.filter(entry=>entry.source_text.toLowerCase().includes(vocabSearch.toLowerCase()));
        for(const entry of rows){
          const card=add(list,'article');card.className='vocab-item';
          add(card,'strong',entry.source_text);
          const actions=add(card,'div');actions.className='actions';
          for(const [action,key] of [['favorite',entry.favorite?'取消收藏':'收藏'],['archive','归档']]){
            button(actions,t(key),event=>{if(event.isTrusted)commands.push({type:'entry',id:entry.id,action});});
          }
          const notes=add(card,'input');notes.type='text';notes.value=entry.notes||'';notes.maxLength=5000;notes.setAttribute('aria-label',t('编辑笔记'));
          button(card,t('编辑笔记'),event=>{if(event.isTrusted)commands.push({type:'entry',id:entry.id,action:'notes',notes:notes.value});},'save');
        }
        if(!rows.length)add(list,'p',t('尚无词条'));
      };
      search.addEventListener('input',()=>{vocabSearch=search.value;draw();});draw();
      const dest=add(view,'div');dest.className='destinations';
      for(const [name,title] of [['notion','Notion'],['obsidian','Obsidian'],['onenote','OneNote']]){
        const label=add(dest,'label',t(title+' 生词本地址'));
        const badge=add(label,'span');badge.className='dest-status';badge.dataset.destStatus=name;
        badge.setAttribute('aria-live','polite');
        const input=add(label,'input');input.dataset.destination=name;input.type='text';
        input.value=destinationDrafts.get(name)??data.destinations?.[name]??'';
        const openDestination=button(dest,t('打开 '+title+' 生词本'),event=>{
          if(event.isTrusted&&validateDestination(name,input.value.trim()))commands.push({type:'destination',name,value:input.value.trim()});
        });
        function refreshDestination(){
          const address=input.value.trim(),valid=Boolean(validateDestination(name,address));
          const state=valid?'on':address?'invalid':'off';
          const description=t(valid?'地址已配置':address?'地址格式无效':'未配置地址');
          badge.dataset.state=state;
          badge.textContent=(valid?'✓ ':address?'! ':'— ')+title+' · '+description;
          input.setAttribute('aria-invalid',String(state==='invalid'));
          openDestination.disabled=!valid;
        }
        input.addEventListener('input',()=>{
          destinationDrafts.set(name,input.value);
          refreshDestination();
        });
        input.addEventListener('change',()=>{
          const address=input.value.trim();
          if(validateDestination(name,address)===undefined)return;
          commands.push({type:'config',change:{destination:{name,value:address}}});
        });
        refreshDestination();
        const syncButton=button(dest,syncNames[index],async event=>{
          if(!event.isTrusted)return;
          try{
            if(name==='onenote'){
              const table=add(document.createDocumentFragment(),'table');
              for(const item of data.entries){const row=add(table,'tr');for(const value of [item.source_text,item.notes,item.favorite?'★':''])add(row,'td',value||'');}
              await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([table.outerHTML],{type:'text/html'}),'text/plain':new Blob([formatEntries(name)],{type:'text/plain'})})]);
            }else await navigator.clipboard.writeText(formatEntries(name));
            syncButton.textContent=copiedNames[index];
          }catch{notice(t('操作失败'));}
        });syncButton.dataset.syncDestination=name;
      }
    }
    if(activeTab==='theme'){
      add(view,'h2',t('播放状态'));
      const status=add(view,'div');status.className='status';
      if(data.media)preview(status,data.media,true);
      else add(status,'strong',data.selected?t(data.mediaPending?'正在准备壁纸':'previewError'):wallpaperOff[index]);
      if(!data.hostConnected)add(status,'p',t('hostUnavailable'));
      const actions=add(view,'div');actions.className='actions';
      button(actions,t('继续播放'),()=>{paused=false;for(const video of [status.querySelector('video'),backdrop.querySelector('video')])void video?.play().catch(()=>{});});
      button(actions,t('暂停'),()=>{paused=true;status.querySelector('video')?.pause();backdrop.querySelector('video')?.pause();});
      button(actions,t('恢复原界面'),()=>{paused=false;data={...data,media:undefined,selected:null};update({wallpaper:null});},'danger');
      const file=add(actions,'input');file.type='file';file.hidden=true;file.accept='image/*,video/*,.mkv';
      button(actions,t('导入本地壁纸'),()=>file.click());
      file.addEventListener('change',()=>{
        queueImport(file.files[0]);file.value='';
      });
      button(actions,t('壁纸库'),()=>{activeTab='library';render();});
      add(view,'h2',t('画面与可读性'));
      const titlebarRow=add(view,'div');titlebarRow.className='color-row';
      const titlebarLabel=add(titlebarRow,'label',t('顶栏颜色'));
      const titlebarMode=add(titlebarLabel,'select');titlebarMode.dataset.setting='titlebarMode';
      for(const [value,label] of [['system','跟随系统背景'],['smart','智能识别'],['custom','自定义选择']]){
        const option=add(titlebarMode,'option',t(label));option.value=value;
      }
      titlebarMode.value=data.theme.titlebarMode;
      titlebarMode.addEventListener('change',()=>update({theme:{titlebarMode:titlebarMode.value}}));
      if(data.theme.titlebarMode==='custom'){
        const pick=add(titlebarRow,'input');pick.type='color';pick.value=data.theme.titlebarColor;
        pick.setAttribute('aria-label',t('顶栏颜色'));
        pick.addEventListener('input',()=>themeAppearance({...data.theme,titlebarColor:pick.value}));
        pick.addEventListener('change',()=>update({theme:{titlebarColor:pick.value}}));
      }
      for(const [key,title,followTitle] of [
        ['fontColor','字体颜色','自动跟随宿主'],
        ['composerBackgroundColor','输入框背景颜色','使用宿主原色']
      ]){
        const row=add(view,'div');row.className='color-row';
        const colorLabel=add(row,'label',t(title));
        const picker=add(colorLabel,'input');picker.type='color';
        if(data.theme[key])colorChoices[key]=data.theme[key];
        picker.value=colorChoices[key];
        picker.disabled=data.theme[key]===null;
        picker.addEventListener('change',()=>{colorChoices[key]=picker.value;update({theme:{[key]:picker.value}});});
        const followLabel=add(row,'label');followLabel.className='color-follow';
        const follow=add(followLabel,'input');follow.type='checkbox';follow.dataset.followColor=key;follow.dataset.setting=key;follow.checked=picker.disabled;
        followLabel.append(t(followTitle));
        follow.addEventListener('change',()=>update({theme:{[key]:follow.checked?null:colorChoices[key]}}));
      }
      for(const [key,title,min,max,factor] of [['opacity','内容背板不透明度',0,100,100],['sidebarOpacity','侧边栏不透明度',0,100,100],['scrimOpacity','背景遮罩',0,100,100],['blurPx','背景模糊',0,100,1],['zoom','画面缩放',0,100,1],['volume','壁纸音量',0,100,100]]){
        const row=add(view,'label',t(title));row.className='control';
        const output=add(row,'output',String(Math.round(data.theme[key]*factor)));
        const input=add(row,'input');input.type='range';input.min=min;input.max=max;input.value=String(Math.round(data.theme[key]*factor));input.dataset.setting=key;
        const showValue=()=>{output.textContent=input.value+(key==='blurPx'?' px':'%');};
        showValue();
        input.addEventListener('input',()=>{showValue();themeAppearance({...data.theme,[key]:Number(input.value)/factor});});
        input.addEventListener('change',()=>update({theme:{[key]:Number(input.value)/factor}}));
      }
      add(view,'small',t('拖动时立即预览，设置自动保存。'));
    }
    themeAppearance(data.theme);
    if(activeTab==='settings'){
      add(view,'h2',t('语言设置'));
      const languageRow=add(view,'div');languageRow.className='language-options';
      const select=add(languageRow,'select');select.setAttribute('aria-label',t('语言设置'));
      for(let i=0;i<languages.length;i++){
        const option=add(select,'option',labels[i]);option.value=languages[i];option.selected=i===index;
        button(languageRow,labels[i],()=>update({language:languages[i]}),i===index?'save active':'save');
      }
      select.addEventListener('change',()=>update({language:select.value}));
      const sync=add(view,'label');sync.className='color-row';
      const check=add(sync,'input');check.type='checkbox';check.checked=config.sync;
      sync.append(t('sync'));check.addEventListener('change',()=>update({sync:check.checked}));
      if(!data.hostConnected)add(view,'p',t('hostUnavailable'));
      add(view,'h2',t('外观'));
      const appearance=add(view,'div');appearance.className='color-row';
      const colorLabel=add(appearance,'label',t('Guarder 面板颜色'));
      const picker=add(colorLabel,'input');picker.type='color';picker.value=color;
      const hex=add(appearance,'input');hex.type='text';hex.maxLength=7;hex.value=color;
      hex.setAttribute('aria-label',t('Guarder 面板颜色 HEX'));
      picker.addEventListener('input',()=>{hex.value=picker.value;panel.style.setProperty('--ui-bg',picker.value);});
      picker.addEventListener('change',()=>update({pageColor:picker.value}));
      hex.addEventListener('change',()=>{
        const value=hex.value.trim();
        if(/^#[a-f0-9]{6}$/i.test(value))update({pageColor:value});
        else hex.value=color;
      });
      button(appearance,t('恢复默认'),()=>update({pageColor:null}),'save');
    }
    if(scrollTop)body.scrollTop=scrollTop;
    if(focusKey){
      const restored=panel.querySelector('[data-setting="'+focusKey+'"],[data-destination="'+focusKey+'"]');
      restored?.focus({preventScroll:true});
      if(restored&&destinationCaret)restored.setSelectionRange(...destinationCaret);
    }
    notifyDockGeometry();
  }

  globalThis.guarder={
    snapshot:(drain=false)=>({language:config.language,sync:config.sync,translated:translated.size,wallpapers:data.wallpapers.length,entries:data.entryCount,open,gemini:dockGeometry(),commands:drain?commands.splice(0):[]}),
    previewReady,posterReady,
    siteError:()=>{siteUnavailable=true;render();},
    browserSignIn:()=>{if(!browserSignInRequired){browserSignInRequired=true;render();}},
    posterBatch:items=>{for(const [id,url] of items)posterReady(id,url);},
    usesNativeCaption:()=>Boolean(nativeCaption&&nativeCaption!=='null'),
    dockStatus:ok=>{if(!ok)notice(t('控制通道未连接'));},
    operationStatus:key=>notice(t(key)),
    importChunk:(offset,length)=>new Promise((resolve,reject)=>{
      if(!importFile){reject(Error('Import file is unavailable'));return;}
      const reader=new FileReader();
      reader.onload=()=>resolve(String(reader.result).split(',')[1]);
      reader.onerror=()=>reject(reader.error);
      reader.readAsDataURL(importFile.slice(offset,offset+length));
    }),
    importFinished:key=>{importFile=undefined;notice(t(key));},
    refresh:(next,nextConfig)=>{
      for(const [name,draft] of destinationDrafts){
        const normalized=validateDestination(name,draft);
        if(normalized!==undefined&&normalized===next.destinations?.[name])destinationDrafts.delete(name);
      }
      data=next;if(nextConfig!==undefined){config=nextConfig;scan();}render();
    },
    stop:()=>{globalThis.guarderDockChanged?.('null');config={...config,sync:false};scan();stopped=true;observer.disconnect();window.removeEventListener('keydown',handleKey);window.removeEventListener('resize',refreshTitlebar);resetTitlebar();selectionEvents.abort();clearTimeout(noticeTimer);overlay.remove();backdrop.remove();themeStyle.remove();for(const surface of composerSurfaces)surface.removeAttribute('data-guarder-composer-surface');for(const surface of hostSurfaces)surface.removeAttribute('data-guarder-host-surface');delete globalThis.guarder;}
  };
  scan();render();
  return globalThis.guarder.snapshot();
}
