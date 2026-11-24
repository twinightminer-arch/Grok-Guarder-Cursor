(() => {
  if (globalThis.grokGuarderHost) return;
  const style = document.createElement('style');
  style.id = 'grok-guarder-host-style';
  const id = 'grok-guarder-host-wallpaper';
  const launcherId = 'grok-guarder-window-icon';
  const surface = 'data-grok-guarder-surface';
  const textInk = 'data-grok-guarder-text';
  const iconInk = 'data-grok-guarder-icon';
  const statusDot = '.ui-sidebar-menu-button-status-icon .ui-agent-status-dot__indicator';
  const marked = new Set();
  let paintedText = new Set();
  let paintedIcons = new Set();
  const originals = new WeakMap();
  const edited = new Set();
  const cursorMessages = [/* Cursor locale data */
    ["A classifier will run for each action and decide whether it's safe to execute this command. Allowlists are still respected.",["系统会逐项判断操作是否可以安全执行，并继续遵守允许列表。","系統會逐項判斷操作是否可以安全執行，并繼續遵守允許清單。","操作ごとに分類器がコマンドの実行可否を判定します。許可リストは引き続き適用されます。","각 작업에 대해 분류기가 명령을 실행해도 안전한지 판단합니다. 허용 목록은 계속 적용됩니다."]],
    ["A new Project's coordinator starts at this effort. You can change it in the chat's model picker.",["新项目的协调智能体默认使用此推理强度。可在聊天的模型选择器中更改。","新專案的協調代理程式預設使用此推理強度。可在聊天的模型選擇器中更改。","新しいプロジェクトのコーディネーターはこの推論強度で開始します。チャットのモデル選択で変更できます。","새 프로젝트의 조정 에이전트는 이 추론 강도로 시작합니다. 채팅의 모델 선택기에서 변경할 수 있습니다."]],
    ["About Cursor",["关于 Cursor","關於 Cursor","Cursor について","Cursor 정보"]],
    ["About the default Explore model",["关于默认探索模型","關於預設探索模型","既定の探索モデルについて","기본 탐색 모델 정보"]],
    ["Accept the next word of a suggestion via Ctrl+RightArrow",["按 Ctrl+右方向键接受建议中的下一个词","按 Ctrl+右方向鍵接受建議中的下一個詞","Ctrl + → で提案の次の単語を確定します","Ctrl + 오른쪽 화살표로 제안의 다음 단어를 수락합니다"]],
    ["Account",["账号","帳戶","アカウント","계정"]],
    ["Actions",["操作","操作","アクション","작업"]],
    ["Add",["添加","新增","追加","추가"]],
    ["Add a Custom MCP Server",["添加自定义 MCP 服务器","新增自訂 MCP 伺服器","カスタム MCP サーバーを追加","사용자 지정 MCP 서버 추가"]],
    ["Add a marketplace from a repository",["从代码仓库添加插件市场","從存放庫新增市集","リポジトリからマーケットプレイスを追加","저장소에서 마켓플레이스 추가"]],
    ["Add a marketplace from your local computer",["从本地计算机添加插件市场","從本機電腦新增市集","ローカルコンピューターからマーケットプレイスを追加","로컬 컴퓨터에서 마켓플레이스 추가"]],
    ["Add agents, context, tools",["添加智能体、上下文或工具","新增代理程式、內容脈絡或工具","エージェント、コンテキスト、ツールを追加","에이전트, 컨텍스트, 도구 추가"]],
    ["Add keyword",["添加关键词","新增關鍵字","キーワードを追加","키워드 추가"]],
    ["Add Marketplace",["添加插件市场","新增外掛市集","マーケットプレイスを追加","마켓플레이스 추가"]],
    ["Add or search model",["添加或搜索模型","新增或搜尋模型","モデルを追加または検索","모델 추가 또는 검색"]],
    ["Add to Cursor",["添加到 Cursor","新增至 Cursor","Cursor に追加","Cursor에 추가"]],
    ["Adjust how much detail is shown for tool calls",["调整工具调用显示的详情量","調整工具呼叫的詳細程度","ツール呼び出しに表示する詳細の量を調整します","도구 호출에 표시할 세부 정보의 양을 조절합니다"]],
    ["Agent",["智能体","代理程式","エージェント","에이전트"]],
    ["Agent Conversations",["智能体对话","代理程式對話","エージェントの会話","에이전트 대화"]],
    ["Agent Orchestration",["智能体编排","代理程式編排","エージェントのオーケストレーション","에이전트 오케스트레이션"]],
    ["Agent Voice",["智能体声音","代理程式語音","エージェントの声","에이전트 음성"]],
    ["Agent Window",["智能体窗口","代理程式視窗","エージェントウィンドウ","에이전트 창"]],
    ["Agents",["智能体","代理程式","エージェント","에이전트"]],
    ["AI ad creatives and paid campaigns: generate image and video ads, then launch and optimize campaigns on Meta, Google, TikTok, LinkedIn & Reddit with ROAS/CTR reporting.",["生成图片和视频广告，在 Meta、Google、TikTok、LinkedIn 和 Reddit 上投放并优化付费广告，查看广告支出回报率和点击率。","生成圖片和影片廣告，在 Meta、Google、TikTok、LinkedIn 和 Reddit 上投放并優化付費廣告，查看廣告支出回報率和按一下率。","画像広告と動画広告を生成し、Meta、Google、TikTok、LinkedIn、Reddit で配信、最適化できます。ROAS と CTR のレポートにも対応します。","이미지 및 동영상 광고를 생성하고 Meta, Google, TikTok, LinkedIn, Reddit에서 캠페인을 실행하고 최적화합니다. ROAS와 CTR 보고서를 제공합니다."]],
    ["AI teammates you can give real work to",["可以交付实际工作的 AI 队友","可以交付實際工作的 AI 隊友","実際の作業を任せられる AI チームメイト","실제 작업을 맡길 수 있는 AI 팀원"]],
    ["Align on implementation before writing code",["编写代码前先确认实现方案","編寫程式碼前先確認實現方案","コードを書く前に実装方針をそろえる","코드를 작성하기 전에 구현 방향 합의"]],
    ["All",["全部","全部","すべて","모두"]],
    ["Allow Agent to search the web for relevant information",["允许智能体搜索网页获取相关信息","允許代理程式搜尋網頁獲取相關資訊","エージェントによる関連情報の Web 検索を許可します","에이전트가 관련 정보를 웹에서 검색하도록 허용합니다"]],
    ["Allow agent to switch to modes like Plan or Debug without asking. When off, Cursor asks first, but skips if unanswered within 15 seconds.",["允许智能体直接切换到规划或调试等模式。关闭后，Cursor 会先询问，15 秒内无回应则跳过切换。","允許代理程式直接切換到規劃或偵錯等模式。關閉后，Cursor 會先詢問，15 秒內無回應則跳過切換。","エージェントが確認なしで計画やデバッグなどのモードに切り替えられるようにします。オフの場合は確認し、15 秒以内に応答がなければ切り替えません。","에이전트가 확인 없이 계획 또는 디버그 등의 모드로 전환하도록 허용합니다. 끄면 Cursor가 먼저 확인하고, 15초 안에 응답이 없으면 전환을 건너뜁니다."]],
    ["Allow all",["允许全部","全部允許","すべて許可","모두 허용"]],
    ["Allow Tab to trigger while in a comment region",["允许在注释区域触发 Tab 补全","允許在注釋區域觸發 Tab 補全","コメント内でも Tab 補完を有効にします","주석 안에서도 Tab 자동 완성이 실행되도록 허용합니다"]],
    ["Allow the agent to celebrate with a shower of confetti",["允许智能体用彩纸特效庆祝","允許代理程式用彩紙特效慶祝","エージェントが紙吹雪でお祝いできるようにします","에이전트가 색종이 효과로 축하하도록 허용합니다"]],
    ["Allowlist Options",["允许列表选项","允許清單選項","許可リストのオプション","허용 목록 옵션"]],
    ["Always-allowed apps: Cursor can use these in any chat without asking. Remove one to be asked again.",["始终允许的应用：Cursor 可在任何聊天中直接使用。移除后会再次询问。","始終允許的應用：Cursor 可在任何聊天中直接使用。移除后會再次詢問。","常に許可するアプリは、どのチャットでも確認なしで使用できます。確認を再開するには一覧から削除します。","항상 허용된 앱은 모든 채팅에서 확인 없이 사용할 수 있습니다. 다시 확인하려면 목록에서 제거하세요."]],
    ["Always-on cloud agents that handle repetitive work",["让常驻云端智能体处理重复工作","讓常駐云端代理程式處理重復工作","繰り返し作業を処理する常時稼働のクラウドエージェント","반복 작업을 처리하는 상시 실행 클라우드 에이전트"]],
    ["Amazon & Walmart retail advertising. Analyze ad performance, track ACoS and ROAS, research keywords, and create and optimize campaigns with your approval.",["分析 Amazon 和 Walmart 零售广告效果，跟踪广告成本占比和广告支出回报率，研究关键词，并经你批准后创建和优化广告活动。","分析 Amazon 和 Walmart 零售廣告效果，跟蹤廣告成本占比和廣告支出回報率，研究關鍵詞，并經你批準后創建和優化廣告活動。","Amazon と Walmart の小売広告の実績を分析し、ACoS と ROAS を追跡します。キーワード調査や、承認後の広告キャンペーン作成と最適化もできます。","Amazon 및 Walmart 소매 광고를 분석하고 ACoS와 ROAS를 추적합니다. 키워드 조사, 승인 후 캠페인 생성 및 최적화도 지원합니다."]],
    ["An AI receptionist that answers your calls, sends and reads texts, and manages contacts.",["接听电话、收发短信和管理联系人的 AI 接待员。","接聽電話、收發短信和管理聯系人的 AI 接待員。","電話応対、メッセージの送受信、連絡先の管理を行う AI 受付担当です。","전화를 받고 문자 메시지를 읽고 보내며 연락처를 관리하는 AI 접수원입니다."]],
    ["Answer questions without making edits",["回答问题，不修改文件","回答問題，不修改檔案","編集せずに質問に回答する","편집 없이 질문에 답변"]],
    ["API Keys",["API 密钥","API 金鑰","API キー","API 키"]],
    ["Appearance",["外观","外觀","外観","모양"]],
    ["Apply .cursorignore files to all subdirectories. Changing this setting requires restarting Cursor.",["将 .cursorignore 规则应用于所有子目录。更改后需要重启 Cursor。","將 .cursorignore 規則應用于所有子目錄。更改后需要重新啟動 Cursor。",".cursorignore をすべてのサブディレクトリに適用します。変更後は Cursor の再起動が必要です。",".cursorignore를 모든 하위 디렉터리에 적용합니다. 변경 후에는 Cursor를 다시 시작해야 합니다."]],
    ["Apps",["应用","套用","適用","적용"]],
    ["Arabic (Egypt)",["阿拉伯语（埃及）","阿拉伯文（埃及）","アラビア語 (エジプト)","아랍어(이집트)"]],
    ["Arabic (Saudi Arabia)",["阿拉伯语（沙特阿拉伯）","阿拉伯文（沙烏地阿拉伯）","アラビア語 (サウジアラビア)","아랍어(사우디아라비아)"]],
    ["Arabic (United Arab Emirates)",["阿拉伯语（阿联酋）","阿拉伯文（阿拉伯聯合大公國）","アラビア語 (アラブ首長国連邦)","아랍어(아랍에미리트)"]],
    ["Archived",["已归档","已封存","アーカイブ済み","보관됨"]],
    ["Artie real-time CDC pipelines via MCP",["通过 MCP 使用 Artie 的实时变更数据捕获管道","透過 MCP 使用 Artie 的實時變更資料捕獲管道","MCP 経由で利用できる Artie のリアルタイム変更データキャプチャパイプライン","MCP를 통해 사용하는 Artie 실시간 변경 데이터 캡처 파이프라인"]],
    ["Ask",["问答","問答","質問","질문"]],
    ["Atlassian plugin for Cursor with MCP and skills for Jira, Confluence, triage, backlogs, status reports, and more.",["Cursor 的 Atlassian 插件，提供 Jira、Confluence、问题分流、待办事项和状态报告等功能所需的 MCP 服务与技能。","Cursor 的 Atlassian 外掛程式，提供 Jira、Confluence、問題分流、待辦事項和狀態報告等功能所需的 MCP 服務與技能。","Jira、Confluence、案件の振り分け、バックログ、進捗レポートなどに対応する MCP とスキルを備えた Cursor 用 Atlassian プラグインです。","Jira, Confluence, 이슈 분류, 백로그, 상태 보고서 등에 사용할 MCP와 스킬을 제공하는 Cursor용 Atlassian 플러그인입니다."]],
    ["Attach",["添加附件","附加","添付","첨부"]],
    ["Attribution",["署名","歸屬標記","帰属表示","출처 표시"]],
    ["Auto-Accept Web Search",["自动接受网页搜索","自動接受網路搜尋","Web 検索を自動承認","웹 검색 자동 승인"]],
    ["Auto-Approve Mode Transitions",["自动批准模式切换","自動核准模式切換","モード変更を自動承認","모드 변경 자동 승인"]],
    ["Auto-detect",["自动检测","自動偵測","自動検出","자동 감지"]],
    ["Auto-Review",["自动审核","自動審核","自動レビュー","자동 검토"]],
    ["Automate repetitive tasks with always-on agents and configure Cursor's built-in agents for your team.",["用常驻智能体自动处理重复任务，并为团队配置 Cursor 内置的智能体。","用常駐代理程式自動處理重復任務，并為團隊設定 Cursor 內建的代理程式。","常時稼働するエージェントで繰り返し作業を自動化し、チーム用に Cursor の組み込みエージェントを設定できます。","상시 실행 에이전트로 반복 작업을 자동화하고 팀용 Cursor 기본 에이전트를 구성합니다."]],
    ["Automate with Hooks",["通过钩子实现自动化","使用掛鉤自動化","フックで自動化","훅으로 자동화"]],
    ["Automatically import agent configs from other tools",["自动从其他工具导入智能体配置","自動從其他工具導入代理程式設定","他のツールのエージェント設定を自動的にインポートします","다른 도구의 에이전트 구성을 자동으로 가져옵니다"]],
    ["Automatically import necessary modules for TypeScript",["自动导入 TypeScript 所需的模块","自動導入 TypeScript 所需的模塊","TypeScript に必要なモジュールを自動的にインポートします","TypeScript에 필요한 모듈을 자동으로 가져옵니다"]],
    ["Automatically index repositories to speed up Grep searches. All data is stored locally.",["自动为代码仓库建立索引以加快 Grep 搜索。所有数据都保存在本地。","自動為程式碼倉庫建立索引以加快 Grep 搜尋。所有資料都儲存在本地。","Grep を高速化するためにリポジトリを自動でインデックス化します。データはすべてローカルに保存されます。","Grep 검색 속도를 높이도록 저장소를 자동으로 인덱싱합니다. 모든 데이터는 로컬에 저장됩니다."]],
    ["Automatically open http and https links in the Browser Tab",["自动在浏览器标签页中打开 http 和 https 链接","自動在瀏覽器分頁中打開 http 和 https 連結","HTTP と HTTPS のリンクをブラウザータブで自動的に開きます","HTTP 및 HTTPS 링크를 브라우저 탭에서 자동으로 엽니다"]],
    ["Automatically open localhost links in the Browser Tab",["自动在浏览器标签页中打开 localhost 链接","自動在瀏覽器分頁中打開 localhost 連結","localhost のリンクをブラウザータブで自動的に開きます","localhost 링크를 브라우저 탭에서 자동으로 엽니다"]],
    ["Automatically resume working on agents and their subagents after a reload or restart",["重新加载或重启后自动恢复智能体及其子智能体的工作","重新載入或重新啟動后自動恢復代理程式及其子代理程式的工作","再読み込みや再起動の後に、エージェントとサブエージェントの作業を自動で再開します","다시 불러오거나 다시 시작한 뒤 에이전트와 하위 에이전트의 작업을 자동으로 재개합니다"]],
    ["Automations",["自动化","自動化","オートメーション","자동화"]],
    ["Back",["后退","返回","戻る","뒤로"],["上一步"]],
    ["Bengali",["孟加拉语","孟加拉文","ベンガル語","벵골어"]],
    ["Beta",["测试版","測試版","ベータ","베타"]],
    ["Branch",["分支","分支","ブランチ","브랜치"]],
    ["Branch Prefix",["分支前缀","分支前綴","ブランチのプレフィックス","브랜치 접두사"]],
    ["Branches",["分支","分支","ブランチ","브랜치"]],
    ["Breadcrumb",["面包屑导航","階層連結","パンくずリスト","이동 경로"]],
    ["Browse",["浏览","瀏覽","参照","찾아보기"]],
    ["Browse Marketplace",["浏览市场","瀏覽外掛市集","マーケットプレイスを閲覧","마켓플레이스 둘러보기"]],
    ["Browser",["浏览器","瀏覽器","ブラウザー","브라우저"]],
    ["Browser & Network",["浏览器与网络","瀏覽器與網路","ブラウザーとネットワーク","브라우저 및 네트워크"]],
    ["Browser Automation",["浏览器自动化","瀏覽器自動化","ブラウザーの自動化","브라우저 자동화"]],
    ["Browser Mode",["浏览器模式","瀏覽器模式","ブラウザーモード","브라우저 모드"]],
    ["Browser Protection",["浏览器保护","瀏覽器防護","ブラウザーの保護","브라우저 보호"]],
    ["Browser Tab",["浏览器标签页","瀏覽器分頁","ブラウザータブ","브라우저 탭"]],
    ["Build",["构建","建置","実装","빌드"]],
    ["Build on each other's ideas. Tell your agent \"make a note.\" Your team, and their agents, can pick it up from there.",["接续彼此的想法。让智能体记下笔记，团队成员及其智能体即可继续推进。","接續彼此的想法。讓代理程式記下筆記，團隊成員及其代理程式即可繼續推進。","互いのアイデアを発展させましょう。エージェントにメモを頼むと、チームやそのエージェントが続きから取り組めます。","서로의 아이디어를 발전시킬 수 있습니다. 에이전트에게 메모를 요청하면 팀원과 각자의 에이전트가 이어서 작업할 수 있습니다."]],
    ["By default, get notifications for stable updates. In Early Access, pre-release builds may be unstable for production work.",["默认接收稳定版更新通知。抢先体验渠道的预发行版本可能不适合生产工作。","預設接收穩定版更新通知。搶先體驗渠道的預發行版本可能不適合生產工作。","既定では安定版の更新通知が届きます。早期アクセスでは、リリース前のビルドが本番作業に適さない場合があります。","기본적으로 안정 버전 업데이트 알림을 받습니다. 얼리 액세스 시험판은 실제 작업에서 불안정할 수 있습니다."]],
    ["Catalan",["加泰罗尼亚语","加泰蘭文","カタロニア語","카탈로니아어"]],
    ["Change list scope — Uncommitted",["改动列表范围：未提交","變更清單範圍：未提交","変更一覧の範囲：未コミット","변경 목록 범위: 커밋되지 않음"]],
    ["Changes",["改动","變更","変更","변경 사항"]],
    ["Changes Sidebar",["改动侧栏","變更側邊欄","変更サイドバー","변경 사항 사이드바"]],
    ["Chat",["聊天","聊天","チャット","채팅"]],
    ["Chat actions",["聊天操作","聊天操作","チャットの操作","채팅 작업"]],
    ["Chat ordering",["聊天排序","聊天排序","チャットの並べ替え","채팅 정렬"]],
    ["Chat width",["聊天宽度","聊天寬度","チャットの幅","채팅 너비"]],
    ["Chat Width",["聊天宽度","聊天寬度","チャットの幅","채팅 너비"]],
    ["Chats",["聊天","聊天","チャット","채팅"]],
    ["Check network connectivity to all Cursor services",["检查所有 Cursor 服务的网络连接","檢查所有 Cursor 服務的網路連線","すべての Cursor サービスへのネットワーク接続を確認します","모든 Cursor 서비스의 네트워크 연결을 확인합니다"]],
    ["Check schema, indexes, and risky access rules",["检查架构、索引和有风险的访问规则","檢查架構、索引和有風險的訪問規則","スキーマ、インデックス、リスクのあるアクセスルールを確認する","스키마, 인덱스, 위험한 액세스 규칙 확인"]],
    ["Chinese (Simplified)",["简体中文","簡體中文","簡体中国語","중국어(간체)"]],
    ["Chinese (Traditional)",["繁体中文","繁體中文","繁体中国語","중국어(번체)"]],
    ["Choose a model or use the cost- and availability-aware default",["选择模型，或使用考虑成本和可用性的默认模型","選擇模型，或使用考慮成本和可用性的預設模型","モデルを選択するか、コストと利用可否を考慮した既定のモデルを使用します","모델을 선택하거나 비용과 가용성을 고려한 기본 모델을 사용합니다"]],
    ["Choose a tint color",["选择色调颜色","選擇色調顏色","色合いを選びます","틴트 색상을 선택합니다"]],
    ["Choose between light, dark, or high contrast themes",["选择浅色、深色或高对比度主题","選擇淺色、深色或高對比度主題","ライト、ダーク、ハイコントラストのテーマから選択します","밝은 테마, 어두운 테마 또는 고대비 테마를 선택합니다"]],
    ["Choose how Agents run tools like command execution, MCP, and file writes.",["选择智能体运行命令、调用 MCP 和写入文件等工具的方式。","選擇代理程式執行指令、調用 MCP 和寫入檔案等工具的方式。","コマンド実行、MCP、ファイル書き込みなどをエージェントが実行する方法を選びます。","명령 실행, MCP, 파일 쓰기 등의 도구를 에이전트가 실행하는 방식을 선택합니다."]],
    ["Choose Origin (cursor.com/codebase), GitHub, or Graphite for pull request links on web and desktop",["选择网页和桌面端拉取请求链接使用的服务：Origin（cursor.com/codebase）、GitHub 或 Graphite","選擇網頁和桌面端拉取請求連結使用的服務：Origin（cursor.com/codebase）、GitHub 或 Graphite","Web とデスクトップのプルリクエストリンクで使うサービスを Origin（cursor.com/codebase）、GitHub、Graphite から選択します","웹과 데스크톱의 끌어오기 요청 링크에 사용할 서비스로 Origin(cursor.com/codebase), GitHub 또는 Graphite를 선택합니다"]],
    ["Choose the default behavior of messages sent from the queue",["选择从队列发送消息时的默认处理方式","選擇從隊列發送消息時的預設處理方式","キューから送信するメッセージの既定の動作を選択します","대기열에서 보내는 메시지의 기본 동작을 선택합니다"]],
    ["Choose the default behavior of messages sent while Agent is working",["选择智能体工作时发送消息的默认处理方式","選擇代理程式工作時發送消息的預設處理方式","エージェントの作業中に送信するメッセージの既定の動作を選択します","에이전트가 작업 중일 때 보내는 메시지의 기본 동작을 선택합니다"]],
    ["Choose which models appear in the model picker",["选择在模型选择器中显示的模型","選擇在模型選擇器中顯示的模型","モデル選択に表示するモデルを選びます","모델 선택기에 표시할 모델을 선택합니다"]],
    ["Choose which source configures this MCP server.",["选择此 MCP 服务器的配置来源。","選擇此 MCP 服務器的設定來源。","この MCP サーバーの設定元を選択します。","이 MCP 서버를 구성할 원본을 선택합니다."]],
    ["Clear log",["清除日志","清除記錄","ログを消去","로그 지우기"]],
    ["Clear Search",["清空搜索","清除搜尋","検索をクリア","검색 지우기"]],
    ["CLI",["命令行","命令列","コマンドライン","명령줄"]],
    ["CLI-backed repo compatibility scans plus agents that audit startup, validation, and docs against reality.",["使用 CLI 扫描代码仓库兼容性，并让智能体核查启动、验证步骤和文档是否符合实际情况。","使用 CLI 掃描程式碼倉庫兼容性，并讓代理程式核查啟動、驗證步驟和文檔是否符合實際情況。","CLI でリポジトリの互換性をスキャンし、エージェントが起動手順、検証、ドキュメントと実際の動作が一致するかを確認します。","CLI로 저장소 호환성을 검사하고 에이전트가 시작, 검증 절차 및 문서가 실제 동작과 일치하는지 확인합니다."]],
    ["Close Settings",["关闭设置","關閉設定","設定を閉じる","설정 닫기"]],
    ["Cloud",["云端","雲端","クラウド","클라우드"]],
    ["Cloud Agents",["云端智能体","雲端代理程式","クラウドエージェント","클라우드 에이전트"]],
    ["Code Block Word Wrap",["代码块自动换行","程式碼區塊自動換行","コードブロックの折り返し","코드 블록 줄 바꿈"]],
    ["Code Font Family",["代码字体","程式碼字型","コードのフォントファミリ","코드 글꼴 패밀리"]],
    ["Code Font Size",["代码字体大小","程式碼字型大小","コードのフォントサイズ","코드 글꼴 크기"]],
    ["Code Intelligence",["代码智能","程式碼智慧","コードインテリジェンス","코드 인텔리전스"]],
    ["Codebase",["代码库","程式碼庫","コードベース","코드베이스"]],
    ["Codebase options",["代码库选项","程式碼庫選項","コードベースのオプション","코드베이스 옵션"]],
    ["Colors",["颜色","色彩","色","색상"]],
    ["Command palette",["命令面板","命令選擇區","コマンドパレット","명령 팔레트"]],
    ["Command Palette",["命令面板","命令選擇區","コマンドパレット","명령 팔레트"]],
    ["Commands",["命令","指令","コマンド","명령"]],
    ["Commands are reusable prompts you invoke with /name to standardize common workflows across your team.",["命令是通过 /name 调用的可复用提示词，可统一团队的常用工作流程。","指令是透過 /name 調用的可復用提示詞，可統一團隊的常用工作流程。","コマンドは /name で呼び出せる再利用可能なプロンプトです。チームの共通ワークフローを標準化できます。","명령은 /name으로 실행하는 재사용 가능한 프롬프트입니다. 팀의 공통 워크플로를 표준화할 수 있습니다."]],
    ["Commit Attribution",["提交署名","提交歸屬標記","コミットの帰属表示","커밋 출처 표시"]],
    ["Compact",["紧凑","精簡","コンパクト","간결하게"]],
    ["Completed",["已完成","已完成","完了","완료"]],
    ["Completion Sound",["完成音效","完成音效","完了音","완료 알림음"]],
    ["Computer Use",["计算机操作","電腦操作","コンピューター操作","컴퓨터 사용"]],
    ["Configure",["配置","設定","構成","구성"]],
    ["Connect Cursor to Asana. Create tasks, update projects, search your workspace, and manage work — directly from the editor.",["将 Cursor 连接到 Asana，直接在编辑器中创建任务、更新项目、搜索工作区和管理工作。","將 Cursor 連線到 Asana，直接在編輯器中創建任務、更新專案、搜尋工作區和管理工作。","Cursor を Asana に接続し、エディターからタスク作成、プロジェクトの更新、ワークスペースの検索、作業の管理ができます。","Cursor를 Asana에 연결하여 편집기에서 작업 생성, 프로젝트 업데이트, 작업 영역 검색 및 업무 관리를 할 수 있습니다."]],
    ["Connect to Envoy to work with workplace visitors, employees, desks, rooms, and other resources.",["连接 Envoy，管理访客、员工、工位、房间和其他办公资源。","連線 Envoy，管理訪客、員工、工位、房間和其他辦公資源。","Envoy に接続して、来訪者、従業員、デスク、会議室などの職場リソースを管理します。","Envoy에 연결하여 방문객, 직원, 좌석, 회의실과 그 밖의 사무실 리소스를 관리합니다."]],
    ["Connect your Flexport account via the hosted MCP at mcp.flexport.com/mcp: look up shipments, check rates, search your network, and book freight using natural language. Requires MCP enabled for your organization by a Flexport admin.",["通过 mcp.flexport.com/mcp 上的托管服务连接 Flexport 账号，使用自然语言查询货运、查看运价、搜索运输网络和预订货运。需要 Flexport 管理员为组织启用 MCP。","透過 mcp.flexport.com/mcp 上的托管服務連線 Flexport 帳號，使用自然語言查詢貨運、查看運價、搜尋運輸網路和預訂貨運。需要 Flexport 管理員為組織啟用 MCP。","mcp.flexport.com/mcp のホスト型 MCP から Flexport に接続すると、自然言語で出荷確認、料金確認、輸送網の検索、貨物の予約ができます。組織で Flexport 管理者による MCP の有効化が必要です。","mcp.flexport.com/mcp의 호스팅된 MCP로 Flexport에 연결하면 자연어로 배송 조회, 운임 확인, 네트워크 검색, 화물 예약을 할 수 있습니다. Flexport 관리자가 조직에서 MCP를 사용하도록 설정해야 합니다."]],
    ["Connected",["已连接","已連線","接続済み","연결됨"]],
    ["Connected to Browser Tab",["已连接到浏览器标签页","已連線至瀏覽器分頁","ブラウザータブに接続済み","브라우저 탭에 연결됨"]],
    ["Connections",["连接","連線","接続","연결"]],
    ["Context and Tools",["上下文和工具","內容脈絡與工具","コンテキストとツール","컨텍스트 및 도구"]],
    ["Context-aware, multi-line suggestions around your cursor based on recent edits",["基于最近编辑，在光标附近提供上下文感知的多行建议","基于最近編輯，在游標附近提供內容脈絡感知的多行建議","最近の編集と周囲の文脈を基に、カーソル付近に複数行の候補を表示します","최근 편집 내용과 컨텍스트를 바탕으로 커서 주변에 여러 줄 제안을 표시합니다"]],
    ["Continue Interrupted Agents",["恢复中断的智能体","繼續中斷的代理程式","中断したエージェントを再開","중단된 에이전트 다시 시작"]],
    ["Control how strongly the tint is applied",["控制色调应用强度","控制色調應用強度","色合いを適用する強さを調整します","틴트가 적용되는 강도를 조절합니다"]],
    ["Control whether agents can read files outside the workspace without approval",["控制智能体是否可以未经批准读取工作区外的文件","控制代理程式是否可以未經批準讀取工作區外的檔案","エージェントが承認なしでワークスペース外のファイルを読み取れるかどうかを制御します","에이전트가 승인 없이 작업 영역 외부 파일을 읽을 수 있는지 제어합니다"]],
    ["Controls which windows Cursor restores on startup",["指定 Cursor 启动时恢复哪些窗口","指定 Cursor 啟動時恢復哪些窗口","Cursor が起動時に復元するウィンドウを指定します","Cursor가 시작할 때 복원할 창을 지정합니다"]],
    ["Conversation",["对话","對話","会話","대화"]],
    ["Conversation density",["对话密度","對話密度","会話の表示密度","대화 표시 밀도"]],
    ["Coordinator effort",["协调智能体的推理强度","協調代理程式的推理強度","コーディネーターの推論強度","조정 에이전트 추론 강도"]],
    ["Copy",["复制","複製","コピー","복사"]],
    ["Copy Domains",["复制域名","複製網域","ドメインをコピー","도메인 복사"]],
    ["Copy error details",["复制错误详情","複製錯誤詳細資料","エラーの詳細をコピー","오류 세부 정보 복사"]],
    ["Create New",["新建","新增","新規作成","새로 만들기"]],
    ["Create Reusable Commands",["创建可复用命令","建立可重複使用的指令","再利用できるコマンドを作成","재사용 가능한 명령 만들기"]],
    ["Create, analyze, and optimize campaigns across Google Ads, Meta Ads, TikTok Ads, LinkedIn Ads, Amazon Ads, and ChatGPT Ads.",["在 Google Ads、Meta Ads、TikTok Ads、LinkedIn Ads、Amazon Ads 和 ChatGPT Ads 上创建、分析和优化广告活动。","在 Google Ads、Meta Ads、TikTok Ads、LinkedIn Ads、Amazon Ads 和 ChatGPT Ads 上創建、分析和優化廣告活動。","Google Ads、Meta Ads、TikTok Ads、LinkedIn Ads、Amazon Ads、ChatGPT Ads の広告キャンペーンを作成、分析、最適化します。","Google Ads, Meta Ads, TikTok Ads, LinkedIn Ads, Amazon Ads 및 ChatGPT Ads에서 캠페인을 생성, 분석하고 최적화합니다."]],
    ["Create, import, and manage project secrets. Import-and-mount workflows, validate local .env mounts before shell commands run.",["创建、导入和管理项目密钥。支持导入与挂载流程，并在运行 Shell 命令前验证本地 .env 挂载。","創建、導入和管理專案密鑰。支援導入與掛載流程，并在執行 Shell 指令前驗證本地 .env 掛載。","プロジェクトのシークレットを作成、インポート、管理します。インポートとマウントに対応し、シェルコマンドの実行前にローカル .env のマウントを検証します。","프로젝트의 비밀 정보를 생성, 가져오기 및 관리합니다. 가져오기와 마운트를 지원하고 셸 명령을 실행하기 전에 로컬 .env 마운트를 검증합니다."]],
    ["Create, inspect, edit, lay out, open and export local draw.io or diagrams.net diagrams, including flowcharts, UML, mind maps, architecture diagrams and organization diagrams derived from Word, PDF, PowerPoint or images.",["创建、检查、编辑、排版、打开和导出本地 draw.io 或 diagrams.net 图表，包括流程图、UML 图、思维导图、架构图，以及根据 Word、PDF、PowerPoint 或图片制作的组织架构图。","創建、檢查、編輯、排版、打開和導出本地 draw.io 或 diagrams.net 圖表，包括流程圖、UML 圖、思維導圖、架構圖，以及根據 Word、PDF、PowerPoint 或圖片制作的組織架構圖。","ローカルの draw.io、diagrams.net の図を作成、確認、編集、配置、表示、書き出しします。フローチャート、UML、マインドマップ、構成図のほか、Word、PDF、PowerPoint、画像を基にした組織図に対応します。","로컬 draw.io 및 diagrams.net 다이어그램을 만들고 검사, 편집, 배치, 열기 및 내보내기할 수 있습니다. 순서도, UML, 마인드맵, 아키텍처 그림과 Word, PDF, PowerPoint 또는 이미지에서 만든 조직도를 지원합니다."]],
    ["Ctrl+Enter submits chat, Enter inserts a newline, and primary actions move to Ctrl+Alt+Enter",["按 Ctrl+Enter 发送聊天，按 Enter 换行，主要操作改用 Ctrl+Alt+Enter","按 Ctrl+Enter 發送聊天，按 Enter 換行，主要操作改用 Ctrl+Alt+Enter","Ctrl + Enter で送信し、Enter で改行します。主要な操作には Ctrl + Alt + Enter を使用します","Ctrl + Enter로 채팅을 보내고 Enter로 줄을 바꿉니다. 기본 작업에는 Ctrl + Alt + Enter를 사용합니다"]],
    ["Cursor Account",["Cursor 账户","Cursor 帳戶","Cursor アカウント","Cursor 계정"]],
    ["Cursor Dark",["Cursor 深色","Cursor 深色","Cursor ダーク","Cursor 어둡게"]],
    ["Cursor Dark High Contrast",["Cursor 深色高对比度","Cursor 深色高對比","Cursor ダーク（ハイコントラスト）","Cursor 어둡게(고대비)"]],
    ["Cursor Default",["Cursor 默认","Cursor 預設","Cursor の既定値","Cursor 기본값"]],
    ["Cursor Light",["Cursor 浅色","Cursor 淺色","Cursor ライト","Cursor 밝게"]],
    ["Cursor Light Colorblind",["Cursor 浅色（色觉辅助）","Cursor 淺色（辨色輔助）","Cursor ライト（色覚サポート）","Cursor 밝게(색각 지원)"]],
    ["Cursor Marketplace",["Cursor 插件市场","Cursor 外掛市集","Cursor マーケットプレイス","Cursor 마켓플레이스"]],
    ["Cursor periodically removes old worktrees to free disk space. Tune how aggressively cleanup runs.",["Cursor 会定期移除旧工作树以释放磁盘空间。可调整清理策略的激进程度。","Cursor 會定期移除舊工作樹以釋放磁盤空間。可調整清理策略的激進程度。","Cursor はディスク領域を確保するため、古いワークツリーを定期的に削除します。クリーンアップの頻度や範囲を調整できます。","Cursor는 디스크 공간을 확보하기 위해 오래된 워크트리를 주기적으로 삭제합니다. 정리 강도를 조절할 수 있습니다."]],
    ["Cursor syncs your local skills so they can be used with Cloud Agents. Turn this off to disable syncing.",["Cursor 会同步本地技能供云端智能体使用。关闭此项可停止同步。","Cursor 會同步本地技能供云端代理程式使用。關閉此項可停止同步。","Cursor はローカルのスキルを同期してクラウドエージェントで利用できるようにします。オフにすると同期が停止します。","Cursor는 클라우드 에이전트에서 사용할 수 있도록 로컬 스킬을 동기화합니다. 끄면 동기화가 중지됩니다."]],
    ["Cursor Tab",["Cursor Tab 补全","Cursor Tab 補全","Cursor Tab 補完","Cursor Tab 자동 완성"]],
    ["Cursor-Managed Worktrees",["Cursor 管理的工作树","Cursor 管理的工作樹","Cursor が管理するワークツリー","Cursor 관리 워크트리"]],
    ["Cursor, Grok Bot, Grok, and X in one plan, with more coding usage.",["一个套餐包含 Cursor、Grok Bot、Grok 和 X，并提供更多编程用量。","一個套餐包含 Cursor、Grok Bot、Grok 和 X，并提供更多編程用量。","Cursor、Grok Bot、Grok、X を 1 つのプランにまとめ、コーディングの利用枠を増やせます。","Cursor, Grok Bot, Grok, X를 하나의 요금제로 이용하고 코딩 사용량도 늘릴 수 있습니다."]],
    ["Customer Support",["客户支持","客戶支援","カスタマーサポート","고객 지원"]],
    ["Customize Sidebar",["自定义侧栏","自訂側邊欄","サイドバーをカスタマイズ","사이드바 사용자 지정"]],
    ["Cut",["剪切","剪下","切り取り","잘라내기"]],
    ["Danish",["丹麦语","丹麥文","デンマーク語","덴마크어"]],
    ["Data & Analytics",["数据与分析","資料與分析","データと分析","데이터 및 분석"]],
    ["Data engineering plugin - warehouse exploration, pipeline authoring, Airflow integration",["用于探索数据仓库、编写管道及集成 Airflow 的数据工程插件","用于探索資料倉庫、編寫管道及集成 Airflow 的資料工程外掛程式","データウェアハウスの探索、パイプラインの作成、Airflow の統合を支援するデータエンジニアリング用プラグイン","데이터 웨어하우스 탐색, 파이프라인 작성 및 Airflow 통합을 지원하는 데이터 엔지니어링 플러그인"]],
    ["Datasets and fine-tuning workflows powered by Adaption.",["由 Adaption 提供数据集和微调流程。","由 Adaption 提供資料集和微調流程。","Adaption が提供するデータセットとファインチューニングのワークフローです。","Adaption이 제공하는 데이터 세트 및 미세 조정 워크플로입니다."]],
    ["Debug",["调试","偵錯","デバッグ","디버그"]],
    ["Debug an issue",["调试问题","偵錯問題","問題をデバッグ","문제 디버그"]],
    ["Debug issues",["调试问题","偵錯問題","問題をデバッグ","문제 디버그"]],
    ["Decrease",["减小","減少","減らす","줄이기"]],
    ["Default Browser",["默认浏览器","預設瀏覽器","既定のブラウザー","기본 브라우저"]],
    ["Default Environment",["默认环境","預設環境","既定の環境","기본 환경"]],
    ["Default Model",["默认模型","預設模型","既定のモデル","기본 모델"]],
    ["Default voice for voice chats. Changing the voice plays a short sample.",["语音聊天使用的默认声音。更换时会播放简短试听。","語音聊天使用的預設聲音。更換時會播放簡短試聽。","音声チャットの既定の声です。変更すると短いサンプルが再生されます。","음성 채팅의 기본 음성입니다. 변경하면 짧은 샘플이 재생됩니다."]],
    ["Delegate Work to Subagents",["把工作委派给子智能体","將工作委派給子代理程式","作業をサブエージェントに委任","하위 에이전트에 작업 위임"]],
    ["Deploy my prototype",["部署我的原型","部署我的原型","プロトタイプをデプロイ","내 프로토타입 배포"]],
    ["Detailed",["详细","詳細","詳細表示","자세히 표시"]],
    ["Dictate",["听写","聽寫","音声入力","받아쓰기"]],
    ["Discard",["放弃","捨棄","破棄","취소"]],
    ["Discover",["发现","探索","見つける","둘러보기"]],
    ["Dismiss",["消除","關閉","無視","해제"],["关闭"]],
    ["Dismiss recommendation",["关闭推荐","關閉建議","おすすめを閉じる","추천 닫기"]],
    ["Docs",["文档","文件","ドキュメント","문서"]],
    ["Documentation",["文档","文件","ドキュメント","문서"]],
    ["Draft",["草稿","草稿","下書き","초안"]],
    ["Drag and drop agent chats to split your view into tiled panes",["拖放智能体聊天，将视图拆分为平铺窗格","拖放代理程式聊天，將視圖拆分為平鋪窗格","エージェントのチャットをドラッグして、ビューを並べて表示するペインに分割できます","에이전트 채팅을 끌어 놓으면 화면이 나란히 배치된 창으로 분할됩니다"]],
    ["Dutch",["荷兰语","荷蘭文","オランダ語","네덜란드어"]],
    ["e.g., *.md, **/generated/**",["例如 *.md, **/generated/**","例如 *.md, **/generated/**","例：*.md, **/generated/**","예: *.md, **/generated/**"]],
    ["Early Access",["抢先体验","搶先體驗","早期アクセス","얼리 액세스"]],
    ["Edit",["编辑","編輯","編集","편집"]],
    ["Editor",["编辑器","編輯器","エディター","편집기"]],
    ["Editor Options",["编辑器选项","編輯器選項","エディターのオプション","편집기 옵션"]],
    ["Enable language server by default to provide code intelligence in agent worktree workspaces",["默认启用语言服务器，为智能体的工作树提供代码智能","預設啟用語言服務器，為代理程式的工作樹提供程式碼智能","エージェントのワークツリーでコードインテリジェンスを提供するため、既定で言語サーバーを有効にします","에이전트 워크트리에 코드 인텔리전스를 제공하도록 언어 서버를 기본으로 사용합니다"]],
    ["Enable language server by default to provide code intelligence in workspaces",["默认启用语言服务器，为工作区提供代码智能","預設啟用語言服務器，為工作區提供程式碼智能","ワークスペースでコードインテリジェンスを提供するため、既定で言語サーバーを有効にします","작업 영역에 코드 인텔리전스를 제공하도록 언어 서버를 기본으로 사용합니다"]],
    ["Enable LSPs",["启用语言服务器","啟用語言伺服器","言語サーバーを有効にする","언어 서버 사용"]],
    ["Enable LSPs for Worktrees",["为工作树启用语言服务器","為工作樹啟用語言伺服器","ワークツリーで言語サーバーを有効にする","워크트리에서 언어 서버 사용"]],
    ["Enable or disable individual tools.",["单独启用或停用工具。","個別啟用或停用工具。","ツールごとに有効または無効にします。","각 도구를 개별적으로 켜거나 끕니다."]],
    ["English",["英语","英文","英語","영어"]],
    ["Enter Full Screen",["进入全屏","進入全螢幕","全画面表示にする","전체 화면 시작"]],
    ["Environment",["运行环境","執行環境","実行環境","실행 환경"]],
    ["Error",["错误","錯誤","エラー","오류"]],
    ["Error parsing skill",["技能解析失败","剖析技能時發生錯誤","スキルの解析エラー","스킬 구문 분석 오류"]],
    ["Execution and Approvals",["执行与审批","執行與核准","実行と承認","실행 및 승인"]],
    ["Execution Log",["执行日志","執行記錄","実行ログ","실행 로그"]],
    ["Exit",["退出","結束","終了","종료"]],
    ["Exit Full Screen",["退出全屏","離開全螢幕","全画面表示を終了","전체 화면 종료"]],
    ["Explore Subagent Model",["探索子智能体模型","探索子代理程式模型","探索サブエージェントのモデル","탐색 하위 에이전트 모델"]],
    ["Extension Security",["扩展安全","擴充功能安全性","拡張機能のセキュリティ","확장 프로그램 보안"]],
    ["External-File Protection",["外部文件保护","外部檔案保護","外部ファイルの保護","외부 파일 보호"]],
    ["Featured",["特色","精選","おすすめ","추천"]],
    ["File",["文件","檔案","ファイル","파일"]],
    ["File-Deletion Protection",["文件删除保护","檔案刪除保護","ファイル削除の保護","파일 삭제 보호"]],
    ["Files",["文件","檔案","ファイル","파일"]],
    ["Filter results",["筛选结果","篩選結果","結果を絞り込む","결과 필터링"]],
    ["Filters",["筛选条件","篩選條件","フィルター","필터"]],
    ["Finance and Legal",["财务与法务","財務與法務","財務と法務","재무 및 법무"]],
    ["find",["查找","尋找","検索","찾기"]],
    ["Find root causes and fix tricky bugs",["查明根因并修复复杂问题","查明根本原因并修復復雜問題","根本原因を突き止め、複雑な不具合を修正する","근본 원인을 찾아 까다로운 버그 수정"]],
    ["Finnish",["芬兰语","芬蘭文","フィンランド語","핀란드어"]],
    ["Follow System High Contrast",["跟随系统高对比度设置","跟隨系統高對比設定","システムのハイコントラストに従う","시스템 고대비 설정 따르기"]],
    ["Font size for code editors and diffs",["代码编辑器和差异视图的字体大小","程式碼編輯器和差異視圖的字型大小","コードエディターと差分ビューのフォントサイズ","코드 편집기 및 차이 보기의 글꼴 크기"]],
    ["Forward",["前进","前進","進む","앞으로"]],
    ["French",["法语","法文","フランス語","프랑스어"]],
    ["Frontend QA",["前端质量检查","前端品質檢查","フロントエンドの品質確認","프런트엔드 품질 검사"]],
    ["Fun",["趣味效果","趣味效果","遊び心","재미 요소"]],
    ["General",["通用","一般","一般","일반"]],
    ["Generate an implementation plan",["生成实现计划","生成實現計劃","実装計画を作成する","구현 계획 생성"]],
    ["German",["德语","德文","ドイツ語","독일어"]],
    ["Get Grok Bot",["获取 Grok Bot","取得 Grok Bot","Grok Bot を入手","Grok Bot 받기"]],
    ["Getting Started",["入门指南","入門指南","はじめに","시작하기"]],
    ["Give the Agent a Confetti Cannon",["为智能体启用彩纸特效","為代理程式啟用彩紙特效","エージェントに紙吹雪を表示","에이전트에 색종이 효과 사용"]],
    ["Give your agent its own email address, separate from your mailbox. Create inboxes, send and receive email, automate email workflows, and create accounts with AgentID.",["为智能体提供独立邮箱。可创建收件箱、收发邮件、自动化邮件流程，并使用 AgentID 创建账号。","為代理程式提供獨立郵箱。可創建收件箱、收發電子郵件、自動化電子郵件流程，并使用 AgentID 創建帳號。","エージェント専用のメールアドレスを作成できます。受信トレイの作成、メールの送受信、メール処理の自動化、AgentID でのアカウント作成に対応します。","에이전트에 별도의 이메일 주소를 제공합니다. 받은 편지함 만들기, 이메일 보내기 및 받기, 이메일 작업 자동화, AgentID를 통한 계정 생성을 지원합니다."]],
    ["Glob patterns for files where Cursor Tab will not suggest",["Cursor Tab 不提供建议的文件 Glob 模式","Cursor Tab 不提供建議的檔案 Glob 模式","Cursor Tab の候補を表示しないファイルの glob パターン","Cursor Tab이 제안하지 않을 파일의 glob 패턴"]],
    ["Greek",["希腊语","希臘文","ギリシャ語","그리스어"]],
    ["Group ordering",["分组排序","群組排序","グループの並べ替え","그룹 정렬"]],
    ["Grouping",["分组方式","分組方式","グループ化","그룹화"]],
    ["Groups",["分组","群組","グループ","그룹"]],
    ["Guide Agent with Rules",["使用规则引导智能体","使用規則引導代理程式","ルールでエージェントをガイド","규칙으로 에이전트 안내"]],
    ["Hebrew",["希伯来语","希伯來文","ヘブライ語","히브리어"]],
    ["Help",["帮助","說明","ヘルプ","도움말"]],
    ["Hide Apps",["隐藏应用","隱藏應用程式","アプリを非表示にする","앱 숨기기"]],
    ["Hide Email Address",["隐藏邮箱地址","隱藏電子郵件地址","メールアドレスを非表示にする","이메일 주소 숨기기"]],
    ["Hide Sidebar",["隐藏侧栏","隱藏側邊欄","サイドバーを非表示にする","사이드바 숨기기"]],
    ["Hierarchical Cursor Ignore",["分层 Cursor 忽略规则","分層套用 Cursor 忽略規則","Cursor の除外ルールを階層化","Cursor 제외 규칙 계층 적용"]],
    ["High",["高","高","強","높음"]],
    ["High Contrast",["高对比度","高對比","ハイコントラスト","고대비"]],
    ["Hindi",["印地语","印地文","ヒンディー語","힌디어"]],
    ["Hooks",["钩子","掛鉤","フック","훅"]],
    ["Hooks run custom scripts at lifecycle events to observe, control, and extend the agent loop.",["钩子在生命周期事件中运行自定义脚本，以观察、控制和扩展智能体的运行流程。","鉤子在生命周期事件中執行自訂腳本，以觀察、控制和擴充功能代理程式的執行流程。","フックはライフサイクルイベントでカスタムスクリプトを実行し、エージェントの処理を監視、制御、拡張します。","훅은 수명 주기 이벤트에서 사용자 지정 스크립트를 실행하여 에이전트의 처리 과정을 관찰하고 제어하며 확장합니다."]],
    ["Hooks that run during the agent's loop will show up here.",["此处显示智能体运行过程中执行的钩子。","此處顯示代理程式執行過程中執行的鉤子。","エージェントの処理中に実行されたフックがここに表示されます。","에이전트의 처리 과정에서 실행된 훅이 여기에 표시됩니다."]],
    ["How quickly the voice speaks in voice chats.",["设置语音聊天的说话速度。","設定語音聊天的說話速度。","音声チャットで話す速さを設定します。","음성 채팅에서 말하는 속도를 설정합니다."]],
    ["HTTP Compatibility Mode",["HTTP 兼容模式","HTTP 相容模式","HTTP 互換モード","HTTP 호환 모드"]],
    ["HTTP/2 is recommended for low-latency streaming. In some corporate proxy and VPN environments, the compatibility mode may need to be lowered.",["建议使用 HTTP/2 来降低流式响应延迟。在某些企业代理或 VPN 环境中，可能需要选择较低的协议版本。","建議使用 HTTP/2 來降低流式回應延遲。在某些企業代理或 VPN 環境中，可能需要選擇較低的通訊協定版本。","低遅延のストリーミングには HTTP/2 を推奨します。一部の企業プロキシや VPN では、互換性のため下位のバージョンが必要です。","지연이 낮은 스트리밍에는 HTTP/2를 권장합니다. 일부 기업 프록시 또는 VPN 환경에서는 호환을 위해 낮은 버전이 필요할 수 있습니다."]],
    ["Hue",["色相","色相","色相","색조"]],
    ["Hungarian",["匈牙利语","匈牙利文","ハンガリー語","헝가리어"]],
    ["Ignore Files",["忽略文件","忽略檔案","除外ファイル","제외 파일"]],
    ["Ignore Symlinks in Cursor Ignore Search",["Cursor 忽略搜索中忽略符号链接","尋找 Cursor 忽略檔案時略過符號連結","Cursor 除外ファイルの検索時にシンボリックリンクを無視","Cursor 제외 파일 검색 시 심볼릭 링크 무시"]],
    ["Ignored Files",["忽略的文件","已忽略的檔案","除外されたファイル","제외된 파일"]],
    ["Import Claude Code Conversations",["导入 Claude Code 对话","匯入 Claude Code 對話","Claude Code の会話をインポート","Claude Code 대화 가져오기"]],
    ["Import from Disk",["从磁盘导入","從磁碟匯入","ディスクからインポート","디스크에서 가져오기"]],
    ["Import from GitHub",["从 GitHub 导入","從 GitHub 匯入","GitHub からインポート","GitHub에서 가져오기"]],
    ["Imports",["导入","匯入","インポート","가져오기"]],
    ["Inbox and Collaboration",["收件箱与协作","收件匣與協作","受信トレイと共同作業","받은 편지함 및 협업"]],
    ["Include Third-Party Plugins, Skills, and Other Configs",["包含第三方插件、技能和其他配置","包含第三方外掛程式、技能及其他設定","サードパーティ製プラグイン、スキル、その他の設定を含める","타사 플러그인, 스킬 및 기타 구성 포함"]],
    ["Included Usage",["套餐用量","方案內含用量","含まれる使用量","포함된 사용량"]],
    ["Increase",["增大","增加","増やす","늘리기"]],
    ["Index Repositories for Instant Grep",["为代码仓库建立索引以加速 Grep","為存放庫編製索引以加快 Grep","高速 Grep 用にリポジトリのインデックスを作成","빠른 Grep을 위해 저장소 인덱싱"]],
    ["Indonesian",["印度尼西亚语","印尼文","インドネシア語","인도네시아어"]],
    ["Infrastructure",["基础设施","基礎架構","インフラストラクチャ","인프라"]],
    ["Inside Cursor",["在 Cursor 内","在 Cursor 內","Cursor 内","Cursor 내부"]],
    ["Installed",["已安装","已安裝","インストール済み","설치됨"]],
    ["Intensity",["强度","強度","強度","강도"]],
    ["Interrupt",["中断","中斷","割り込み","중단"]],
    ["Italian",["意大利语","義大利文","イタリア語","이탈리아어"]],
    ["Japanese",["日语","日文","日本語","일본어"]],
    ["Keyboard Shortcuts",["键盘快捷方式","鍵盤快速鍵","キーボード ショートカット","키보드 바로 가기"]],
    ["Korean",["韩语","韓文","韓国語","한국어"]],
    ["Language",["语言","語言","言語","언어"]],
    ["Language used in voice chats.",["语音聊天使用的语言。","語音聊天使用的語言。","音声チャットで使用する言語です。","음성 채팅에서 사용하는 언어입니다."]],
    ["Last Used",["上次使用的位置","上次使用的位置","前回使用した場所","마지막으로 사용한 위치"]],
    ["Last Used Windows",["上次使用的窗口","上次使用的視窗","前回使用したウィンドウ","마지막으로 사용한 창"]],
    ["Learn more",["了解详细信息","瞭解詳情","詳細","자세히 알아보기"]],
    ["Learn More",["了解详细信息","深入了解","詳細情報","자세히 알아보기"]],
    ["Legacy Terminal Tool",["旧版终端工具","舊版終端機工具","従来のターミナルツール","레거시 터미널 도구"]],
    ["Loading changes",["正在加载改动","正在載入變更","変更を読み込み中","변경 사항을 불러오는 중"]],
    ["Loading usage",["正在加载用量","正在載入用量","使用量を読み込み中","사용량을 불러오는 중"]],
    ["Local",["本地","本機","ローカル","로컬"]],
    ["Log Out",["退出登录","登出","ログアウト","로그아웃"]],
    ["Low",["低","低","低","낮음"]],
    ["LSP",["语言服务器协议（LSP）","語言伺服器通訊協定（LSP）","言語サーバープロトコル（LSP）","언어 서버 프로토콜(LSP)"]],
    ["Machine",["计算机","電腦","コンピューター","컴퓨터"]],
    ["Malay",["马来语","馬來文","マレー語","말레이어"]],
    ["Manage",["管理","管理","管理","관리"]],
    ["Manage installed plugins",["管理已安装的插件","管理已安裝的外掛程式","インストール済みプラグインを管理","설치된 플러그인 관리"]],
    ["Manage Origin Settings",["管理 Origin 设置","管理 Origin 設定","Origin の設定を管理","Origin 설정 관리"]],
    ["Manage scope",["管理范围","管理範圍","適用範囲を管理","범위 관리"]],
    ["Manage your account and billing",["管理你的账户和账单","管理帳戶與帳單","アカウントと請求を管理","계정 및 결제 관리"]],
    ["Manual",["手动","手動","手動","수동"]],
    ["Manually Sent Messages from Queue",["手动从队列发送的消息","從佇列手動傳送的訊息","キューから手動送信したメッセージ","대기열에서 수동으로 보낸 메시지"]],
    ["Mark Agent commits as 'Made with Cursor'",["将智能体的提交标记为「使用 Cursor 创建」","將代理程式的提交標記為「使用 Cursor 創建」","エージェントのコミットに「Made with Cursor」を付けます","에이전트의 커밋에 ‘Made with Cursor’를 표시합니다"]],
    ["Mark All as Read",["全部标记为已读","全部標示為已讀","すべて既読にする","모두 읽음으로 표시"]],
    ["Mark pull requests as made with Cursor",["将拉取请求标记为「使用 Cursor 创建」","將拉取請求標記為「使用 Cursor 創建」","プルリクエストに Cursor で作成したことを示します","끌어오기 요청에 Cursor로 만들었음을 표시합니다"]],
    ["Marketing automation, CRM, and email marketing powered by ActiveCampaign. Manage contacts, campaigns, automations, deals, and get AI-powered marketing insights from your AI agent.",["借助 ActiveCampaign 实现营销自动化、客户关系管理和邮件营销。管理联系人、活动、自动化流程和商机，并从智能体获取营销分析。","借助 ActiveCampaign 實現營銷自動化、客戶關系管理和電子郵件營銷。管理聯系人、活動、自動化流程和商機，并從代理程式獲取營銷分析。","ActiveCampaign によるマーケティング自動化、CRM、メールマーケティングです。連絡先、キャンペーン、自動化、商談を管理し、AI エージェントによる分析を利用できます。","ActiveCampaign의 마케팅 자동화, CRM 및 이메일 마케팅을 이용합니다. 연락처, 캠페인, 자동화, 거래를 관리하고 AI 에이전트의 마케팅 분석을 확인할 수 있습니다."]],
    ["Marketplace",["应用市场","市集","マーケットプレース","마켓플레이스"],["市场","商店"]],
    ["Max Total Size (GB)",["总大小上限（GB）","總大小上限（GB）","合計サイズの上限（GB）","최대 총 크기(GB)"]],
    ["Max Worktrees",["工作树数量上限","工作樹數量上限","ワークツリー数の上限","최대 워크트리 수"]],
    ["Maximum Local LSP Workspaces",["本地语言服务器工作区上限","本機 LSP 工作區上限","ローカル LSP ワークスペースの上限","최대 로컬 LSP 작업 영역 수"]],
    ["Maximum local workspaces that can run language servers at the same time",["能够同时运行语言服务器的本地工作区数量上限","能夠同時執行語言服務器的本地工作區數量上限","言語サーバーを同時に実行できるローカルワークスペースの上限","언어 서버를 동시에 실행할 수 있는 로컬 작업 영역의 최대 개수"]],
    ["Maximum number of Cursor-managed worktrees to retain across all workspaces. Older worktrees are removed first.",["在所有工作区中保留的 Cursor 管理工作树最大数量。较旧的工作树会优先移除。","在所有工作區中保留的 Cursor 管理工作樹最大數量。較舊的工作樹會優先移除。","全ワークスペースで保持する Cursor 管理ワークツリーの上限です。古いものから削除します。","모든 작업 영역에서 유지할 Cursor 관리 워크트리의 최대 개수입니다. 오래된 워크트리부터 제거합니다."]],
    ["Maximum Remote LSP Workspaces",["远程语言服务器工作区上限","遠端 LSP 工作區上限","リモート LSP ワークスペースの上限","최대 원격 LSP 작업 영역 수"]],
    ["Maximum remote workspaces that can run language servers at the same time",["能够同时运行语言服务器的远程工作区数量上限","能夠同時執行語言服務器的遠程工作區數量上限","言語サーバーを同時に実行できるリモートワークスペースの上限","언어 서버를 동시에 실행할 수 있는 원격 작업 영역의 최대 개수"]],
    ["Maximum total size in GB across all Cursor-managed worktrees. Set to 0 to disable the size limit.",["所有 Cursor 管理工作树的最大总大小（GB）。设为 0 可禁用大小限制。","所有 Cursor 管理工作樹的最大總大小（GB）。設為 0 可禁用大小限制。","Cursor が管理する全ワークツリーの合計サイズ上限（GB）です。0 に設定すると制限を解除します。","Cursor가 관리하는 모든 워크트리의 최대 총 크기(GB)입니다. 0으로 설정하면 제한이 해제됩니다."]],
    ["Maximum total worktree size in gigabytes",["最大工作树总大小（GB）","工作樹總大小上限（GB）","ワークツリーの合計サイズ上限（GB）","워크트리 최대 총 크기(GB)"]],
    ["Maximum worktree count",["最大工作树数量","工作樹數量上限","ワークツリー数の上限","최대 워크트리 수"]],
    ["MCP",["MCP 服务","MCP 服務","MCP サービス","MCP 서비스"]],
    ["MCPs",["MCP 服务","MCP 服務","MCP サービス","MCP 서비스"]],
    ["Medium",["中","中等","中","중간"]],
    ["Meet Grok Bot",["认识 Grok Bot","認識 Grok Bot","Grok Bot の紹介","Grok Bot을 만나보세요"]],
    ["Microphone",["麦克风","麥克風","マイク","마이크"]],
    ["Microphone used in voice chats.",["语音聊天使用的麦克风。","語音聊天使用的麥克風。","音声チャットで使用するマイクです。","음성 채팅에서 사용하는 마이크입니다."]],
    ["Minimap",["缩略图","縮圖","ミニマップ","미니맵"]],
    ["Minimize interface animations. System follows your OS preference.",["尽量减少界面动画。「跟随系统」会遵循操作系统的偏好。","盡量減少界面動畫。「跟隨系統」會遵循操作系統的偏好。","画面のアニメーションを最小限にします。「システム」では OS の設定に従います。","화면 애니메이션을 최소화합니다. ‘시스템’은 운영체제 설정을 따릅니다."]],
    ["Mobile",["移动端","行動裝置","モバイル","모바일"]],
    ["Mode",["模式","模式","モード","모드"]],
    ["Models",["模型","模型","モデル","모델"]],
    ["more",["更多","更多","その他","더 보기"]],
    ["More models are only available on paid plans.",["更多模型仅在付费套餐中提供。","更多模型僅在付費套餐中提供。","より多くのモデルは有料プランで利用できます。","더 많은 모델은 유료 요금제에서 사용할 수 있습니다."]],
    ["Motion",["动画","動畫","アニメーション","애니메이션"]],
    ["Narrow",["窄","窄","狭い","좁게"]],
    ["Needs Attention",["需要关注","需要留意","対応が必要","확인 필요"]],
    ["Needs Decision",["需要决策","需要決定","判断が必要","결정 필요"]],
    ["Network",["网络","網路","ネットワーク","네트워크"]],
    ["Network diagnostics",["网络诊断","網路診斷","ネットワーク診断","네트워크 진단"]],
    ["Network Diagnostics",["网络诊断","網路診斷","ネットワーク診断","네트워크 진단"]],
    ["Network protocol",["网络协议","網路通訊協定","ネットワークプロトコル","네트워크 프로토콜"]],
    ["New",["新建","新增","新規","새로 만들기"]],
    ["New Browser",["新建浏览器","新增瀏覽器","新しいブラウザー","새 브라우저"]],
    ["New Folder",["新建文件夹","新增資料夾","新しいフォルダー","새 폴더"]],
    ["New MCP Server",["新建 MCP 服务器","新增 MCP 伺服器","新しい MCP サーバー","새 MCP 서버"]],
    ["New Messages",["新消息","新訊息","新しいメッセージ","새 메시지"]],
    ["New Terminal",["新建终端","新增終端機","新しいターミナル","새 터미널"]],
    ["New Worktree",["新建工作树","新增工作樹","新しいワークツリー","새 워크트리"]],
    ["Nightly",["每夜构建版","每日建置版","ナイトリービルド","나이틀리 빌드"]],
    ["No always-allowed apps yet. Choose Always Allow when Cursor asks to use an app.",["暂无始终允许的应用。Cursor 请求使用应用时可选择「始终允许」。","暫無始終允許的應用。Cursor 請求使用應用時可選擇「始終允許」。","常に許可するアプリはまだありません。Cursor が確認したときに「常に許可」を選択できます。","항상 허용된 앱이 없습니다. Cursor가 앱 사용을 요청할 때 ‘항상 허용’을 선택할 수 있습니다."]],
    ["No Cursor-managed worktrees on this machine.",["此机器上没有 Cursor 管理的工作树。","此機器上沒有 Cursor 管理的工作樹。","このマシンに Cursor 管理のワークツリーはありません。","이 컴퓨터에는 Cursor가 관리하는 워크트리가 없습니다."]],
    ["No hook executions yet",["暂无钩子执行记录","尚無掛鉤執行記錄","まだフックは実行されていません","아직 실행된 훅이 없습니다"]],
    ["No PR",["无拉取请求","無提取要求","プルリクエストなし","끌어오기 요청 없음"]],
    ["No Repo",["无仓库","無儲存庫","リポジトリなし","리포지토리 없음"]],
    ["Norwegian",["挪威语","挪威文","ノルウェー語","노르웨이어"]],
    ["Not now",["暂不","稍後再說","今はしない","나중에"]],
    ["Notifications",["通知","通知","通知","알림"]],
    ["Off",["关闭","關閉","閉じる","닫기"],["关"]],
    ["On",["开启","開啟","オン","켜기"]],
    ["Open Command Palette",["打开命令面板","開啟命令選擇區","コマンドパレットを開く","명령 팔레트 열기"]],
    ["Open config",["打开配置","開啟設定","設定ファイルを開く","구성 파일 열기"]],
    ["Open Cursor Account",["打开 Cursor 账号","開啟 Cursor 帳戶","Cursor アカウントを開く","Cursor 계정 열기"]],
    ["Open Cursor Settings",["打开 Cursor 设置","開啟 Cursor 設定","Cursor の設定を開く","Cursor 설정 열기"]],
    ["Open Customize",["打开自定义","開啟自訂","カスタマイズを開く","사용자 지정 열기"]],
    ["Open Folder",["打开文件夹","開啟資料夾","フォルダーを開く","폴더 열기"]],
    ["Open IDE",["打开编辑器","開啟編輯器","IDE を開く","IDE 열기"]],
    ["Open in IDE",["在编辑器中打开","在編輯器中開啟","IDE で開く","IDE에서 열기"]],
    ["Open Local Links in Cursor Browser",["在 Cursor 浏览器中打开本地链接","在 Cursor 瀏覽器中開啟本機連結","ローカルリンクを Cursor ブラウザーで開く","로컬 링크를 Cursor 브라우저에서 열기"]],
    ["Open new tab menu",["打开新标签页菜单","開啟新增分頁選單","新しいタブのメニューを開く","새 탭 메뉴 열기"]],
    ["Open Origin Settings",["打开 Origin 设置","開啟 Origin 設定","Origin の設定を開く","Origin 설정 열기"]],
    ["Open pull request links inside Cursor or in the default browser",["在 Cursor 或默认浏览器中打开拉取请求链接","在 Cursor 或預設瀏覽器中打開拉取請求連結","プルリクエストリンクを Cursor 内または既定のブラウザーで開きます","끌어오기 요청 링크를 Cursor 또는 기본 브라우저에서 엽니다"]],
    ["Open Web Links in Cursor Browser",["在 Cursor 浏览器中打开网页链接","在 Cursor 瀏覽器中開啟網頁連結","Web リンクを Cursor ブラウザーで開く","웹 링크를 Cursor 브라우저에서 열기"]],
    ["Open Workspace",["打开工作区","開啟工作區","ワークスペースを開く","작업 영역 열기"]],
    ["Opens a submenu",["打开子菜单","開啟子選單","サブメニューを開く","하위 메뉴 열기"]],
    ["Orchestrate multiple subagents in parallel",["并行协调多个子智能体","并行協調多個子代理程式","複数のサブエージェントを並列で連携させる","여러 하위 에이전트를 병렬로 조정"]],
    ["Ordering",["排序方式","排序方式","並べ替え","정렬"]],
    ["Override the Cursor user interface typeface",["覆盖 Cursor 用户界面字体","覆蓋 Cursor 使用者介面字型","Cursor のユーザーインターフェイスのフォントを変更します","Cursor 사용자 인터페이스의 글꼴을 변경합니다"]],
    ["Override the font for code editors and diffs",["自定义代码编辑器和差异视图字体","自訂程式碼編輯器和差異視圖字型","コードエディターと差分ビューのフォントを変更します","코드 편집기와 차이 보기의 글꼴을 변경합니다"]],
    ["Pane",["窗格","窗格","ペイン","창"]],
    ["Partial Accepts",["部分接受","部分接受","部分的に適用","부분 수락"]],
    ["Partial Accepts keybinding: Ctrl+RightArrow",["部分接受快捷键：Ctrl+右方向键","部分接受快速鍵：Ctrl+右方向鍵","部分適用のショートカット：Ctrl + →","부분 수락 단축키: Ctrl + 오른쪽 화살표"]],
    ["Partially mask your email address in the Cursor user interface",["在 Cursor 用户界面中部分隐藏你的邮箱地址","在 Cursor 使用者介面中部分隱藏你的郵箱地址","Cursor の画面に表示されるメールアドレスの一部を隠します","Cursor 화면에 표시되는 이메일 주소의 일부를 가립니다"]],
    ["Paste",["粘贴","貼上","貼り付け","붙여넣기"]],
    ["Patterns for designing CLIs that coding agents can run reliably: non-interactive flags, layered help with examples, pipelines, actionable errors, idempotency, and dry-run.",["为编程智能体设计可靠 CLI 的常用做法，包括非交互选项、分层帮助与示例、管道、可据以排查的错误提示、幂等性和试运行。","為編程代理程式設計可靠 CLI 的常用做法，包括非交互選項、分層幫助與示例、管道、可據以排查的錯誤提示、冪等性和試執行。","コーディングエージェントが安定して実行できる CLI の設計例です。非対話型オプション、例付きの階層的なヘルプ、パイプライン、対処法のあるエラー、冪等性、ドライランを扱います。","코딩 에이전트가 안정적으로 실행할 수 있는 CLI 설계 방식입니다. 비대화형 옵션, 예제를 포함한 도움말, 파이프라인, 해결 방법을 안내하는 오류, 멱등성 및 모의 실행을 다룹니다."]],
    ["Pin / Unpin Agent",["置顶或取消置顶智能体","釘選或取消釘選代理程式","エージェントのピン留めを切り替える","에이전트 고정 또는 고정 해제"]],
    ["Pinpoint the root cause of an issue",["定位问题根因","定位問題根本原因","問題の根本原因を特定する","문제의 근본 원인 파악"]],
    ["Plan",["规划","規劃","計画","계획"]],
    ["Plan & Usage",["套餐与用量","方案與用量","プランと使用量","요금제 및 사용량"]],
    ["Plan Mode",["规划模式","規劃模式","計画モード","계획 모드"]],
    ["Plan, Build, / for skills, @ for context",["规划或构建，按 / 使用技能，按 @ 添加上下文","規劃或建置，/ 使用技能，@ 新增上下文","計画・実装、/ でスキル、@ でコンテキスト","계획과 빌드, / 스킬, @ 컨텍스트"]],
    ["Play a sound when agents finish or need attention",["智能体完成任务或需要关注时播放提示音","代理程式完成任務或需要關注時播放提示音","エージェントが作業を完了したとき、または対応が必要なときに音を鳴らします","에이전트의 작업이 끝났거나 확인이 필요할 때 소리를 재생합니다"]],
    ["Play Error chime",["播放错误提示音","播放錯誤提示音","エラー音を再生","오류 알림음 재생"]],
    ["Play Needs Decision chime",["播放需要决策提示音","播放需要決定的提示音","判断が必要なときの通知音を再生","결정 필요 알림음 재생"]],
    ["Play Result Arrives chime",["播放收到结果提示音","播放收到結果的提示音","結果到着時の通知音を再生","결과 도착 알림음 재생"]],
    ["Play Task Sent chime",["播放任务已发送提示音","播放任務已傳送的提示音","タスク送信音を再生","작업 전송 알림음 재생"]],
    ["Play voice sample",["播放语音试听","播放語音範例","音声サンプルを再生","음성 샘플 재생"]],
    ["Plays when a result arrives after silence.",["静默一段时间后收到结果时播放。","靜默一段時間后收到結果時播放。","しばらく応答がなかった後に結果が届くと再生します。","잠시 응답이 없다가 결과가 도착하면 재생합니다."]],
    ["Plays when a task is sent.",["发送任务时播放。","發送任務時播放。","タスクを送信したときに再生します。","작업을 전송할 때 재생합니다."]],
    ["Plays when an error occurs.",["发生错误时播放。","發生錯誤時播放。","エラーが発生したときに再生します。","오류가 발생할 때 재생합니다."]],
    ["Plays when the agent needs a decision.",["智能体需要你做决定时播放。","代理程式需要你做決定時播放。","エージェントが判断を求めたときに再生します。","에이전트가 결정을 요청할 때 재생합니다."]],
    ["Plugin",["插件","外掛程式","プラグイン","플러그인"]],
    ["Plugins",["插件","外掛程式","プラグイン","플러그인"]],
    ["Plugins, MCPs, Skills, and Rules have moved to Customize",["插件、MCP 服务、技能和规则已移到「自定义」","外掛程式、MCP 服務、技能和規則已移到「自訂」","プラグイン、MCP サービス、スキル、ルールは「カスタマイズ」に移動しました","플러그인, MCP 서비스, 스킬 및 규칙이 ‘사용자 지정’으로 이동했습니다"]],
    ["Polish",["波兰语","波蘭文","ポーランド語","폴란드어"]],
    ["Portuguese",["葡萄牙语","葡萄牙文","ポルトガル語","포르투갈어"]],
    ["Portuguese (Brazil)",["葡萄牙语（巴西）","葡萄牙文（巴西）","ポルトガル語 (ブラジル)","포르투갈어(브라질)"],["葡萄牙语(巴西)"]],
    ["Portuguese (Portugal)",["葡萄牙语（葡萄牙）","葡萄牙文（葡萄牙）","ポルトガル語 (イベリア半島)","포르투갈어(유럽)"],["葡萄牙语(葡萄牙)"]],
    ["PPC advertising agent for Google and Bing. Research keywords and competitor ads, launch search campaigns, and optimize paid-search spending—with your approval.",["适用于 Google 和 Bing 的按点击付费广告智能体。研究关键词和竞争对手广告，并经你批准后投放搜索广告和优化支出。","適用于 Google 和 Bing 的按按一下付費廣告代理程式。研究關鍵詞和競爭對手廣告，并經你批準后投放搜尋廣告和優化支出。","Google と Bing 向けの PPC 広告エージェントです。キーワードや競合広告を調査し、承認後に検索広告の配信と費用の最適化を行います。","Google과 Bing용 클릭당 과금 광고 에이전트입니다. 키워드와 경쟁사 광고를 조사하고, 승인 후 검색 캠페인을 실행하고 비용을 최적화합니다."]],
    ["PR",["拉取请求","提取要求","プルリクエスト","끌어오기 요청"]],
    ["PR Attribution",["PR 署名","提取要求歸屬標記","プルリクエストの帰属表示","끌어오기 요청 출처 표시"]],
    ["PR Closed",["拉取请求已关闭","提取要求已關閉","閉じたプルリクエスト","닫힌 끌어오기 요청"]],
    ["PR Draft",["拉取请求草稿","提取要求草稿","下書きのプルリクエスト","초안 끌어오기 요청"]],
    ["PR Link Destination",["拉取请求链接打开位置","提取要求連結開啟位置","プルリクエストリンクを開く場所","끌어오기 요청 링크를 열 위치"]],
    ["PR Merged",["拉取请求已合并","提取要求已合併","マージ済みのプルリクエスト","병합된 끌어오기 요청"]],
    ["PR Open",["拉取请求已打开","提取要求已開啟","開いているプルリクエスト","열린 끌어오기 요청"]],
    ["Prefix for new branches created by Agent (e.g., cursor/, username/)",["智能体创建新分支时使用的前缀（例如 cursor/、username/）","代理程式創建新分支時使用的前綴（例如 cursor/、username/）","エージェントが作成する新しいブランチのプレフィックス（例：cursor/、username/）","에이전트가 만드는 새 브랜치의 접두사(예: cursor/, username/)"]],
    ["Premium",["高级版","進階版","プレミアム","프리미엄"]],
    ["Prevent Agent from automatically running Browser tools",["阻止智能体自动运行浏览器工具","阻止代理程式自動執行瀏覽器工具","エージェントがブラウザーツールを自動実行しないようにします","에이전트가 브라우저 도구를 자동으로 실행하지 못하게 합니다"]],
    ["Prevent Agent from creating or modifying files outside of the workspace automatically",["阻止智能体自动创建或修改工作区外的文件","阻止代理程式自動創建或修改工作區外的檔案","エージェントがワークスペース外のファイルを自動で作成、変更できないようにします","에이전트가 작업 영역 외부 파일을 자동으로 만들거나 변경하지 못하게 합니다"]],
    ["Prevent Agent from deleting files automatically",["阻止智能体自动删除文件","阻止代理程式自動刪除檔案","エージェントによるファイルの自動削除を防ぎます","에이전트가 파일을 자동으로 삭제하지 못하게 합니다"]],
    ["Privacy",["隐私","隱私","プライバシー","개인 정보 보호"]],
    ["Privacy Mode",["隐私模式","隱私模式","プライバシーモード","개인 정보 보호 모드"]],
    ["Private",["私有","私人","非公開","프라이빗"],["专用"]],
    ["Productivity",["效率工具","生產力工具","生産性","생산성"]],
    ["Prompt",["提示词","提示詞","プロンプト","프롬프트"]],
    ["Pull Requests",["拉取请求","提取要求","プルリクエスト","끌어오기 요청"]],
    ["Put a project on a shareable live link",["把项目发布到可分享的实时链接","把專案發布到可分享的實時連結","プロジェクトを共有可能な公開リンクに配置する","공유 가능한 라이브 링크로 프로젝트 게시"]],
    ["Read Access",["读取权限","讀取權限","読み取りアクセス","읽기 권한"]],
    ["Read-only marketing analytics and attribution. Report ad performance across Google, Meta, TikTok, LinkedIn, Amazon, Microsoft, ChatGPT and Walmart Ads, plus GA4, Search Console and Tag Manager. Changes nothing.",["提供只读营销分析和归因报告，涵盖 Google、Meta、TikTok、LinkedIn、Amazon、Microsoft、ChatGPT 和 Walmart Ads，以及 GA4、Search Console 和 Tag Manager。","提供只讀營銷分析和歸因報告，涵蓋 Google、Meta、TikTok、LinkedIn、Amazon、Microsoft、ChatGPT 和 Walmart Ads，以及 GA4、Search Console 和 Tag Manager。","読み取り専用のマーケティング分析とアトリビューションです。Google、Meta、TikTok、LinkedIn、Amazon、Microsoft、ChatGPT、Walmart Ads、GA4、Search Console、Tag Manager の広告実績をレポートします。","읽기 전용 마케팅 분석 및 기여도 보고를 제공합니다. Google, Meta, TikTok, LinkedIn, Amazon, Microsoft, ChatGPT, Walmart Ads, GA4, Search Console 및 Tag Manager의 광고 성과를 보고합니다."]],
    ["Reads",["读取权限","讀取權限","読み取り","읽기"]],
    ["Recents",["最近使用","最近使用","最近使用した項目","최근 항목"]],
    ["Redo",["重做","重做","やり直し","다시 실행"],["恢复"]],
    ["Reduce Motion",["减少动画","減少動畫","アニメーションを減らす","애니메이션 줄이기"]],
    ["Reduce Transparency",["降低透明度","降低透明度","透明度を下げる","투명도 줄이기"]],
    ["Refresh model list",["刷新模型列表","重新整理模型清單","モデル一覧を更新","모델 목록 새로 고침"]],
    ["Refreshing Changes",["正在刷新改动","正在重新整理變更","変更を更新中","변경 사항을 새로 고치는 중"]],
    ["Reload Window",["重新加载窗口","重新載入視窗","ウィンドウの再読み込み","창 다시 로드"]],
    ["Remote",["远程","遠端","リモート","원격"]],
    ["Remote Machine",["远程计算机","遠端電腦","リモートマシン","원격 컴퓨터"]],
    ["Remote Machines",["远程计算机","遠端電腦","リモートマシン","원격 컴퓨터"]],
    ["Remove Debug",["移除调试模式","移除偵錯模式","デバッグモードを解除","디버그 모드 제거"]],
    ["Remove submit",["移除 submit 关键词","移除 submit 關鍵字","submit キーワードを削除","submit 키워드 제거"]],
    ["Replace translucent surfaces with opaque backgrounds",["用不透明背景替换半透明界面","用不透明背景替換半透明界面","半透明の領域を不透明な背景に置き換えます","반투명 영역을 불투명한 배경으로 바꿉니다"]],
    ["Report Issue",["报告问题","回報問題","問題を報告","문제 신고"]],
    ["Repository",["代码仓库","程式碼儲存庫","リポジトリ","리포지토리"],["仓库"]],
    ["Required domains",["必需域名","必要網域","必要なドメイン","필수 도메인"]],
    ["Required Domains",["必需域名","必要網域","必要なドメイン","필수 도메인"]],
    ["Reset Zoom",["重置缩放","重設縮放","ズームをリセット","확대·축소 초기화"]],
    ["Resets",["重置时间","重設時間","リセット日時","초기화 시간"]],
    ["Resize panel",["调整面板大小","調整面板大小","パネルのサイズを変更","패널 크기 조정"]],
    ["Resize sidebar",["调整侧栏宽度","調整側邊欄大小","サイドバーのサイズを変更","사이드바 크기 조정"]],
    ["Result Arrives",["收到结果","收到結果","結果が届いたとき","결과 도착"]],
    ["Results",["结果","結果","結果","결과"]],
    ["Review my database",["审查我的数据库","檢查我的資料庫","データベースをレビュー","내 데이터베이스 검토"]],
    ["Review Provider",["代码审查服务","程式碼審查服務","レビューサービス","코드 검토 서비스"]],
    ["Romanian",["罗马尼亚语","羅馬尼亞文","ルーマニア語","루마니아어"]],
    ["Rules",["规则","規則","ルール","규칙"]],
    ["Rules give Agent persistent, system-level instructions for your coding standards and workflows.",["通过规则为智能体提供持续生效的系统级指令，约定编码规范和工作流程。","透過規則為代理程式提供持續生效的系統級指令，約定編碼規范和工作流程。","ルールにより、コーディング規約とワークフローに関するシステムレベルの指示をエージェントに継続的に適用できます。","규칙을 사용하면 코딩 표준과 워크플로에 관한 시스템 수준 지시를 에이전트에 지속해서 적용할 수 있습니다."]],
    ["Run Diagnostic",["运行诊断","執行診斷","診断を実行","진단 실행"]],
    ["Run Mode",["运行模式","執行模式","実行モード","실행 모드"]],
    ["Run on",["运行位置","執行位置","実行先","실행 위치"]],
    ["Run on a schedule, or from Slack, Linear, and pull requests",["定时运行，或从 Slack、Linear 和拉取请求触发","定時執行，或從 Slack、Linear 和拉取請求觸發","スケジュール、Slack、Linear、プルリクエストから実行できます","일정에 따라 실행하거나 Slack, Linear, 끌어오기 요청에서 실행할 수 있습니다"]],
    ["Russian",["俄语","俄文","ロシア語","러시아어"]],
    ["Sales",["销售","銷售","営業","영업"]],
    ["Sample diff preview for the code font",["代码字体的差异视图预览","程式碼字型的差異檢視預覽","コードフォントの差分プレビュー","코드 글꼴 차이 보기 미리 보기"]],
    ["Scale of the whole Cursor window, the same as Zoom In and Zoom Out",["调整整个 Cursor 窗口的缩放比例，效果与放大和缩小相同","調整整個 Cursor 窗口的縮放比例，效果與放大和縮小相同","Cursor ウィンドウ全体の倍率です。拡大、縮小と同じ設定です","Cursor 창 전체의 배율입니다. 확대 및 축소와 동일한 설정입니다"]],
    ["Scroll left",["向左滚动","向左捲動","左にスクロール","왼쪽으로 스크롤"]],
    ["Scroll right",["向右滚动","向右捲動","右にスクロール","오른쪽으로 스크롤"]],
    ["Search",["搜索","搜尋","検索","검색"]],
    ["Search candidates, prep interviews, and manage pipeline tasks.",["搜索候选人、准备面试并管理招聘流程任务。","搜尋候選人、準備面試并管理招聘流程任務。","候補者の検索、面接の準備、採用プロセスのタスク管理を行います。","지원자를 검색하고 면접을 준비하며 채용 과정의 작업을 관리합니다."]],
    ["Search chats, files, and actions...",["搜索聊天、文件和操作…","搜尋聊天、檔案與操作…","チャット、ファイル、アクションを検索…","채팅, 파일, 작업 검색…"]],
    ["Search events and schedule meetings.",["搜索日程并安排会议。","搜尋日程并安排會議。","予定を検索し、会議を設定します。","일정을 검색하고 회의를 예약합니다."]],
    ["Search Plugins, Skills, MCPs...",["搜索插件、技能和 MCP 服务…","搜尋外掛程式、技能與 MCP 服務…","プラグイン、スキル、MCP サービスを検索…","플러그인, 스킬, MCP 서비스 검색…"]],
    ["Search repos, cloud environments...",["搜索代码仓库和云端环境…","搜尋存放庫與雲端環境…","リポジトリ、クラウド環境を検索…","저장소 및 클라우드 환경 검색…"]],
    ["Search Settings",["搜索设置","搜尋設定","設定を検索","설정 검색"]],
    ["Search skills, context, chats",["搜索技能、上下文和聊天","搜尋技能、內容脈絡與聊天","スキル、コンテキスト、チャットを検索","스킬, 컨텍스트, 채팅 검색"]],
    ["Search skills, context, chats...",["搜索技能、上下文和聊天…","搜尋技能、內容脈絡與聊天…","スキル、コンテキスト、チャットを検索…","스킬, 컨텍스트, 채팅 검색…"]],
    ["Search, read, and send Microsoft Outlook email, and look up contacts.",["搜索、阅读和发送 Microsoft Outlook 邮件，并查找联系人。","搜尋、閱讀和發送 Microsoft Outlook 電子郵件，并查找聯系人。","Microsoft Outlook でメールを検索、閲覧、送信し、連絡先を調べます。","Microsoft Outlook 이메일을 검색하고 읽고 보내며 연락처를 조회합니다."]],
    ["Search, read, create, and share files.",["搜索、读取、创建和共享文件。","搜尋、讀取、創建和共享檔案。","ファイルを検索、閲覧、作成、共有します。","파일을 검색하고 읽고 만들고 공유합니다."]],
    ["Search, read, draft, and manage email.",["搜索、阅读、撰写和管理邮件。","搜尋、閱讀、撰寫和管理電子郵件。","メールを検索、閲覧、作成、管理します。","이메일을 검색하고 읽고 작성하고 관리합니다."]],
    ["Select",["选择","選取","選択","선택"]],
    ["Select a project",["选择项目","選擇專案","プロジェクトを選択","프로젝트 선택"]],
    ["Select All",["全选","全選","すべて選択","모두 선택"],["选择全部"]],
    ["Select branch",["选择分支","選擇分支","ブランチを選択","브랜치 선택"]],
    ["Select Instance",["选择实例","選擇執行個體","インスタンスを選択","인스턴스 선택"]],
    ["Send after Agent finishes",["智能体完成后发送","代理程式完成后發送","エージェントの作業完了後に送信","에이전트가 작업을 마친 후 전송"]],
    ["Send Immediately",["立即发送","立即傳送","すぐに送信","즉시 보내기"]],
    ["Set the maximum width of Agent conversations",["设置智能体对话的最大宽度","設定代理程式對話的最大寬度","エージェントの会話に使用する最大幅を指定します","에이전트 대화의 최대 너비를 지정합니다"]],
    ["Set up a team marketplace",["设置团队插件市场","設定團隊外掛程式市場","チームのマーケットプレイスをセットアップ","팀 마켓플레이스 설정"]],
    ["settings",["设置","設定","設定","설정"]],
    ["Settings",["设置","設定","設定","설정"]],
    ["Settings and privacy",["设置与隐私","設定與隱私","設定とプライバシー","설정 및 개인정보 보호"]],
    ["Setup",["设置","設定","設定","설정"]],
    ["Shared long-term memory, document search and a code index for Cursor from a self-hosted ClickHouse Loom server, over MCP, with the loom and loom-code skills that say when to recall, save and ask the code index.",["通过 MCP 接入自托管的 ClickHouse Loom，为 Cursor 提供共享长期记忆、文档搜索和代码索引。loom 和 loom-code 技能会指引何时读取或保存记忆，以及何时查询代码索引。","透過 MCP 接入自托管的 ClickHouse Loom，為 Cursor 提供共享長期記憶、文檔搜尋和程式碼索引。loom 和 loom-code 技能會指引何時讀取或儲存記憶，以及何時查詢程式碼索引。","MCP 経由でセルフホストの ClickHouse Loom に接続すると、Cursor で共有長期メモリ、文書検索、コードインデックスを利用できます。loom と loom-code スキルが、記憶の読み書きやコード検索を行うタイミングを案内します。","MCP로 자체 호스팅 ClickHouse Loom에 연결하면 Cursor에서 공유 장기 메모리, 문서 검색 및 코드 인덱스를 사용할 수 있습니다. loom과 loom-code 스킬은 메모리를 불러오거나 저장할 때와 코드 검색을 실행할 때를 안내합니다."]],
    ["Show",["显示","顯示","表示","표시"]],
    ["Show Apps",["显示应用","顯示應用程式","アプリを表示","앱 표시"]],
    ["Show Cursor in system tray",["在系统托盘中显示 Cursor","在系統托盤中顯示 Cursor","システムトレイに Cursor を表示します","시스템 트레이에 Cursor를 표시합니다"]],
    ["Show environment filters",["显示运行环境筛选条件","顯示環境篩選條件","環境フィルターを表示","환경 필터 표시"]],
    ["Show more",["查看更多","顯示更多","さらに表示","더 보기"]],
    ["Show notifications for less urgent issues",["显示较低优先级问题的通知","顯示較低優先級問題的通知","緊急性の低い問題についても通知します","긴급하지 않은 문제도 알립니다"]],
    ["Show PR filters",["显示拉取请求筛选条件","顯示提取要求篩選條件","プルリクエストのフィルターを表示","끌어오기 요청 필터 표시"]],
    ["Show rotating tips on the empty screen",["在空白界面轮播提示","在空白界面輪播提示","空の画面にヒントを順番に表示します","빈 화면에 팁을 번갈아 표시합니다"]],
    ["Show Sidebar",["显示侧栏","顯示側邊欄","サイドバーを表示","사이드바 표시"]],
    ["Show source filters",["显示来源筛选条件","顯示來源篩選條件","ソースフィルターを表示","원본 필터 표시"]],
    ["Show status filters",["显示状态筛选条件","顯示狀態篩選條件","ステータスフィルターを表示","상태 필터 표시"]],
    ["Show system notifications when Agent completes or needs attention",["当智能体完成或需要注意时显示系统通知","當代理程式完成或需要注意時顯示系統通知","エージェントが作業を完了したとき、または対応が必要なときにシステム通知を表示します","에이전트의 작업이 끝났거나 확인이 필요할 때 시스템 알림을 표시합니다"]],
    ["Sidebar",["侧栏","側邊欄","サイドバー","사이드바"]],
    ["Sidebar filters",["侧栏筛选条件","側邊欄篩選條件","サイドバーのフィルター","사이드바 필터"]],
    ["Skills",["技能","技能","スキル","스킬"]],
    ["Skip approval dialog; Agent may run web searches automatically",["跳过审批对话框，允许智能体自动进行网页搜索","跳過核準對話框，允許代理程式自動進行網頁搜尋","承認の確認を省略し、エージェントが Web 検索を自動で実行できるようにします","승인 창을 건너뛰고 에이전트가 웹 검색을 자동으로 실행하도록 허용합니다"]],
    ["Source",["来源","來源","ソース","원본"],["源"]],
    ["Source Control",["源代码管理","原始檔控制","ソース管理","소스 제어"]],
    ["Spanish",["西班牙语","西班牙文","スペイン語","스페인어"]],
    ["Spanish (Mexico)",["西班牙语（墨西哥）","西班牙文（墨西哥）","スペイン語 (メキシコ)","스페인어(멕시코)"],["西班牙语(墨西哥)"]],
    ["Spanish (Spain)",["西班牙语（西班牙）","西班牙文（西班牙）","スペイン語 (イベリア半島)","스페인어(유럽)"],["西班牙语(西班牙)"]],
    ["Speed",["语速","語速","話す速さ","말하기 속도"]],
    ["Stable",["稳定版","穩定版","安定版","안정 버전"]],
    ["Start voice chat",["开始语音聊天","開始語音聊天","音声チャットを開始","음성 채팅 시작"]],
    ["Start voice input",["开始语音输入","開始語音輸入","音声入力を開始","음성 입력 시작"]],
    ["Start with a plan",["先制定计划","先擬定計畫","計画から始める","계획부터 시작"]],
    ["Startup",["启动","啟動","スタートアップ","시작"]],
    ["Status",["状态","狀態","ステータス","상태"]],
    ["Status Bar",["状态栏","狀態列","ステータス バー","상태 표시줄"]],
    ["Status Chimes",["状态提示音","狀態提示音","ステータス通知音","상태 알림음"]],
    ["Steer",["引导","引導","指示を追加","추가 지시"]],
    ["Steer a running agent without stopping it - set New Messages to Send Immediately in your Agents settings",["在智能体设置中将「新消息」设为「立即发送」，即可在不中断运行的情况下引导智能体","在代理程式設定中將「新消息」設為「立即發送」，即可在不中斷執行的情況下引導代理程式","エージェントを止めずに指示を追加するには、エージェント設定の「新しいメッセージ」を「すぐに送信」にします","실행 중인 에이전트를 멈추지 않고 지시하려면 에이전트 설정에서 ‘새 메시지’를 ‘즉시 보내기’로 설정합니다"]],
    ["Steer the agent without stopping it",["在不中断运行的情况下引导智能体","在不中斷執行的情況下引導代理程式","エージェントを止めずに指示を追加","에이전트를 멈추지 않고 지시"]],
    ["Stop the agent and send the message",["停止智能体并发送消息","停止代理程式并發送消息","エージェントを停止してメッセージを送信","에이전트를 중지하고 메시지 전송"]],
    ["Subagents",["子智能体","子代理程式","サブエージェント","하위 에이전트"]],
    ["Subagents are specialized assistants that run in their own context window so Agent can parallelize and stay focused.",["子智能体是拥有独立上下文的专用助手，让主智能体能够并行处理任务并保持专注。","子代理程式是擁有獨立內容脈絡的專用助手，讓主代理程式能夠并行處理任務并保持專注。","サブエージェントは独自のコンテキストで動作する専門アシスタントです。メインのエージェントは作業に集中しながら並列で処理できます。","하위 에이전트는 독립적인 컨텍스트에서 동작하는 전문 도우미입니다. 주 에이전트가 작업에 집중하면서 여러 작업을 병렬로 처리할 수 있습니다."]],
    ["Submit Keywords",["提交关键词","送出關鍵字","送信キーワード","전송 키워드"]],
    ["Submit with Ctrl + Enter",["使用 Ctrl + Enter 提交","按 Ctrl + Enter 送出","Ctrl + Enter で送信","Ctrl + Enter로 보내기"]],
    ["Suggest edits like new lines and indentation that modify whitespace only",["建议仅修改空白的编辑，例如换行和缩进","建議僅修改空白的編輯，例如換行和縮進","改行やインデントのように空白だけを変更する編集を提案します","줄 바꿈이나 들여쓰기처럼 공백만 변경하는 편집을 제안합니다"]],
    ["Suggestions While Commenting",["注释中显示建议","註解輸入建議","コメント入力中の候補","주석 작성 중 제안"]],
    ["Swedish",["瑞典语","瑞典文","スウェーデン語","스웨덴어"]],
    ["Switch to a high contrast theme when your OS is in a high contrast mode",["操作系统开启高对比度模式时切换到高对比度主题","操作系統開啟高對比度模式時切換到高對比度主題","OS がハイコントラストモードのとき、ハイコントラストのテーマに切り替えます","운영체제가 고대비 모드일 때 고대비 테마로 전환합니다"]],
    ["Sync",["同步","同步","同期","동기화"]],
    ["Sync chats and continue them in Cursor",["同步聊天并在 Cursor 中继续","同步聊天并在 Cursor 中繼續","チャットを同期し、Cursor で続けます","채팅을 동기화하고 Cursor에서 이어서 작업합니다"]],
    ["Sync Skills for Cloud Agents",["同步技能到云端智能体","同步技能至雲端代理程式","クラウドエージェントにスキルを同期","클라우드 에이전트에 스킬 동기화"]],
    ["Sync your local skills to use them with Cloud Agents. Any changes will update automatically.",["将本地技能同步到云端智能体。后续改动会自动同步。","將本地技能同步到云端代理程式。后續改動會自動同步。","ローカルのスキルをクラウドエージェントで使えるように同期します。変更は自動で反映されます。","클라우드 에이전트에서 사용할 수 있도록 로컬 스킬을 동기화합니다. 변경 사항은 자동으로 반영됩니다."]],
    ["System Default",["系统默认","系統預設","システムの既定値","시스템 기본값"]],
    ["System font",["系统字体","系統字型","システムフォント","시스템 글꼴"]],
    ["System monospace",["系统等宽字体","系統等寬字型","システムの等幅フォント","시스템 고정 너비 글꼴"]],
    ["System Notifications",["系统通知","系統通知","システム通知","시스템 알림"]],
    ["System Tray Icon",["系统托盘图标","系統匣圖示","システムトレイのアイコン","시스템 트레이 아이콘"]],
    ["Tab",["Tab 补全","定位鍵","タブ","탭"]],
    ["Tagalog",["他加禄语","菲律賓文","フィリピノ語","필리핀어"]],
    ["Talk with your agents out loud. Turn this off to hide voice chat everywhere you use Cursor.",["与智能体进行语音对话。关闭后，Cursor 会隐藏语音聊天入口。","與代理程式進行語音對話。關閉后，Cursor 會隱藏語音聊天入口。","エージェントと声で会話できます。オフにすると Cursor 全体で音声チャットが非表示になります。","에이전트와 음성으로 대화합니다. 끄면 Cursor의 모든 화면에서 음성 채팅이 숨겨집니다."]],
    ["Tamil",["泰米尔语","坦米爾文","タミル語","타밀어"]],
    ["Task Models",["任务模型","任務模型","タスク用モデル","작업 모델"]],
    ["Task Sent",["任务已发送","任務已傳送","タスクを送信したとき","작업 전송"]],
    ["Tell Cursor to use subagents to break down tasks, do work in parallel, and preserve context",["让 Cursor 使用子智能体拆解任务、并行处理工作并保留上下文","讓 Cursor 使用子代理程式拆解任務、并行處理工作并保留內容脈絡","Cursor にサブエージェントを使うよう指示すると、タスクを分割し、コンテキストを維持しながら並列に作業できます","Cursor에 하위 에이전트를 사용하도록 지시하면 작업을 나누어 컨텍스트를 유지하며 병렬로 처리할 수 있습니다"]],
    ["Telugu",["泰卢固语","泰盧固文","テルグ語","텔루구어"]],
    ["Terminal",["终端","終端機","ターミナル","터미널"]],
    ["Terminal and Editing",["终端与编辑","終端機與編輯","ターミナルと編集","터미널 및 편집"]],
    ["Thai",["泰语","泰文","タイ語","태국어"]],
    ["Theme",["主题","主題","テーマ","테마"]],
    ["Themed Diff Backgrounds",["主题化差异背景","差異檢視背景跟隨主題","差分の背景にテーマを適用","차이 보기 배경에 테마 적용"]],
    ["These domains must be accessible for Cursor to function. Add them to your firewall or proxy allowlist.",["Cursor 正常运行需要访问这些域名。请将它们添加到防火墙或代理的允许列表。","Cursor 正常執行需要訪問這些域名。請將它們添加到防火墻或代理的允許清單。","Cursor の動作には、これらのドメインへのアクセスが必要です。ファイアウォールまたはプロキシの許可リストに追加してください。","Cursor가 작동하려면 이 도메인에 액세스할 수 있어야 합니다. 방화벽 또는 프록시의 허용 목록에 추가하세요."]],
    ["Third-Party Imports",["第三方导入","第三方匯入","サードパーティからのインポート","타사 구성 가져오기"]],
    ["This PC, select environment",["此电脑，选择运行环境","這部電腦，選擇執行環境","この PC、実行環境を選択","이 PC, 실행 환경 선택"]],
    ["Tint hue",["着色色相","著色色相","色合いの色相","틴트 색조"]],
    ["Tint intensity",["着色强度","著色強度","色合いの強度","틴트 강도"]],
    ["Tips",["提示","提示","ヒント","팁"]],
    ["Titlebar",["标题栏","標題列","タイトルバー","제목 표시줄"]],
    ["Tool Call Density",["工具调用详情密度","工具呼叫詳細程度","ツール呼び出しの表示密度","도구 호출 표시 밀도"]],
    ["Tools",["工具","工具","ツール","도구"]],
    ["Try in Chat",["在聊天中试用","在聊天中試用","チャットで試す","채팅에서 사용해 보기"]],
    ["Turkish",["土耳其语","土耳其文","トルコ語","튀르키예어"]],
    ["Typography",["字体排版","字型樣式","タイポグラフィ","타이포그래피"]],
    ["UI Font Family",["界面字体","介面字型","インターフェイスのフォント","인터페이스 글꼴"]],
    ["Ukrainian",["乌克兰语","烏克蘭文","ウクライナ語","우크라이나어"]],
    ["Uncommitted",["未提交","未提交","未コミット","커밋되지 않음"]],
    ["Undo",["撤销","復原","元に戻す","실행 취소"],["撤消"]],
    ["Uninstall",["卸载","解除安裝","アンインストール","제거"]],
    ["Unread",["未读","未讀","未読","읽지 않음"]],
    ["Update Access",["更新渠道","更新管道","更新チャネル","업데이트 채널"]],
    ["Updated",["最近更新","已更新","更新","업데이트"],["已更新"]],
    ["Updates",["更新","更新","更新情報","업데이트"]],
    ["Upgrade to",["升级到","升級至","アップグレード先","업그레이드 대상"]],
    ["Upgrade to Premium",["升级到高级版","升級至進階版","プレミアムにアップグレード","프리미엄으로 업그레이드"]],
    ["Upgrade to unlock Automations",["升级以解锁自动化","升級以解鎖自動化","アップグレードして自動化を利用する","업그레이드하여 자동화 사용"]],
    ["Upgrade to unlock more models",["升级以解锁更多模型","升級以解鎖更多模型","アップグレードしてより多くのモデルを利用する","업그레이드하여 더 많은 모델 사용"]],
    ["Use /create-rule to control agent behavior with system-level instructions",["使用 /create-rule 通过系统级指令控制智能体的行为","使用 /create-rule 透過系統級指令控制代理程式的行為","/create-rule でシステムレベルの指示を追加し、エージェントの動作を制御できます","/create-rule로 시스템 수준 지시를 추가하여 에이전트의 동작을 제어합니다"]],
    ["Use /create-rule to control agent behavior with system-level instructions.",["使用 /create-rule 通过系统级指令控制智能体的行为。","使用 /create-rule 透過系統級指令控制代理程式的行為。","/create-rule でシステムレベルの指示を追加し、エージェントの動作を制御できます。","/create-rule로 시스템 수준 지시를 추가하여 에이전트의 동작을 제어합니다."]],
    ["Use /review to have Cursor find bugs, regressions, security issues, and missing tests",["使用 /review 让 Cursor 查找缺陷、回归问题、安全隐患和缺失的测试","使用 /review 讓 Cursor 查找缺陷、回歸問題、安全隱患和缺失的測試","/review で Cursor に不具合、リグレッション、セキュリティ上の問題、不足しているテストを見つけてもらえます","/review로 Cursor가 버그, 회귀, 보안 문제 및 누락된 테스트를 찾도록 합니다"]],
    ["Use /shell to run commands in the terminal",["使用 /shell 在终端运行命令","使用 /shell 在終端機執行指令","/shell でターミナルからコマンドを実行できます","/shell로 터미널에서 명령을 실행합니다"]],
    ["Use Amplitude like an expert - instrument analytics, discover product opportunities, analyze charts, create dashboards, manage experiments, and understand users and accounts",["使用 Amplitude 配置分析、发现产品机会、分析图表、创建仪表板、管理实验，并了解用户和账号","使用 Amplitude 設定分析、發現產品機會、分析圖表、創建儀表板、管理實驗，并了解使用者和帳號","Amplitude で分析を計測し、製品の機会を発見し、グラフを分析してダッシュボードを作成できます。実験の管理やユーザー、アカウントの理解にも役立ちます","Amplitude에서 분석을 설정하고 제품 기회를 발견하며 차트를 분석하고 대시보드를 만들 수 있습니다. 실험 관리와 사용자 및 계정 분석도 지원합니다"]],
    ["Use Existing...",["使用现有文件夹…","使用現有資料夾…","既存のフォルダーを使用…","기존 폴더 사용…"]],
    ["Use the legacy terminal tool in agent mode, for use on systems with unsupported shell configurations",["在智能体模式下使用旧版终端工具，适用于 shell 配置不受支持的系统","在代理程式模式下使用舊版終端機工具，適用于 shell 設定不受支援的系統","未対応のシェル構成を持つシステム向けに、エージェントモードで従来のターミナルツールを使用します","지원되지 않는 셸 구성을 사용하는 시스템의 에이전트 모드에서 레거시 터미널 도구를 사용합니다"]],
    ["Use the local After Effects MCP bridge to read the running AE project and make tested composition or text-layer edits through Adobe's AfterFX -r scripting entrypoint.",["通过本地 After Effects MCP 桥接读取当前项目，并使用 Adobe 的 AfterFX -r 脚本入口对合成或文本图层进行经过验证的修改。","透過本地 After Effects MCP 橋接讀取當前專案，并使用 Adobe 的 AfterFX -r 腳本入口對合成或文本圖層進行經過驗證的修改。","ローカルの After Effects MCP ブリッジで開いているプロジェクトを読み込み、Adobe AfterFX -r のスクリプト機能で検証済みのコンポジションやテキストレイヤーの編集を行います。","로컬 After Effects MCP 브리지로 실행 중인 프로젝트를 읽고 Adobe AfterFX -r 스크립트 기능으로 검증된 컴포지션 또는 텍스트 레이어 편집을 수행합니다."]],
    ["Use themed background colors for inline code diffs",["为内联代码差异使用主题背景色","為內聯程式碼差異使用主題背景色","インラインのコード差分にテーマの背景色を使用します","인라인 코드 차이에 테마 배경색을 사용합니다"]],
    ["Use with caution. Skip symlinks during .cursorignore file discovery. Enable only when all .cursorignore files are reachable without symlinks. Changing this setting requires restarting Cursor.",["查找 .cursorignore 文件时跳过符号链接。请仅在所有 .cursorignore 文件都能直接访问时启用。更改后需要重启 Cursor。","查找 .cursorignore 檔案時跳過符號連結。請僅在所有 .cursorignore 檔案都能直接訪問時啟用。更改后需要重新啟動 Cursor。",".cursorignore を探すときにシンボリックリンクをスキップします。すべての .cursorignore にリンクなしでアクセスできる場合のみ有効にしてください。変更後は Cursor の再起動が必要です。",".cursorignore 파일 검색에서 심볼릭 링크를 건너뜁니다. 모든 .cursorignore 파일에 링크 없이 접근할 수 있을 때만 사용하세요. 변경 후 Cursor를 다시 시작해야 합니다."]],
    ["Use your skills with Cloud Agents",["在云端智能体中使用技能","在云端代理程式中使用技能","クラウドエージェントでスキルを使う","클라우드 에이전트에서 스킬 사용"]],
    ["User",["用户","使用者","ユーザー","사용자"]],
    ["Verified",["已验证","已驗證","確認済み","검증됨"]],
    ["Verified by Cursor",["经 Cursor 验证","經 Cursor 驗證","Cursor による確認済み","Cursor에서 검증함"]],
    ["Verify Extension Signatures",["验证扩展签名","驗證擴充功能簽章","拡張機能の署名を検証","확장 프로그램 서명 확인"]],
    ["Verify extension signatures when installing and loading extensions. May require an editor restart to take effect.",["安装和加载扩展时验证签名。可能需要重启编辑器才能生效。","安裝和載入擴充功能時驗證簽名。可能需要重新啟動編輯器才能生效。","拡張機能のインストール時と読み込み時に署名を検証します。反映にはエディターの再起動が必要な場合があります。","확장 프로그램을 설치하거나 불러올 때 서명을 확인합니다. 적용하려면 편집기를 다시 시작해야 할 수 있습니다."]],
    ["Vietnamese",["越南语","越南文","ベトナム語","베트남어"]],
    ["View",["视图","檢視","表示","보기"],["查看"]],
    ["View License",["查看许可证","檢視授權","ライセンスを表示","라이센스 보기"]],
    ["View options",["查看选项","檢視選項","表示オプション","보기 옵션"]],
    ["Voice",["语音","語音","音声","음성"]],
    ["Voice chat",["语音聊天","語音聊天","音声チャット","음성 채팅"]],
    ["Wait indefinitely to authenticate when prompted. When off, skip authentication prompts after 30 seconds.",["出现身份验证提示时持续等待。关闭时，30 秒后跳过验证提示。","出現身份驗證提示時持續等待。關閉時，30 秒后跳過驗證提示。","認証を求められたときに無期限で待機します。オフの場合は、30 秒後に認証をスキップします。","인증이 요청되면 시간 제한 없이 기다립니다. 끄면 30초 후에 인증을 건너뜁니다."]],
    ["Warning Notifications",["警告通知","警告通知","警告の通知","경고 알림"]],
    ["We've introduced a new home for all the ways to customize Cursor.",["现在可以在同一页面自定义 Cursor。","現在可以在同一頁面自訂 Cursor。","Cursor のカスタマイズ設定をひとつの場所にまとめました。","Cursor의 사용자 지정 설정을 한곳에 모았습니다."]],
    ["Web",["网页端","網頁","ウェブ","웹"]],
    ["Web Search Tool",["网页搜索工具","網頁搜尋工具","Web 検索ツール","웹 검색 도구"]],
    ["What model new agents use by default",["新智能体默认使用的模型","新代理程式預設使用的模型","新しいエージェントが既定で使用するモデルです","새 에이전트가 기본으로 사용하는 모델입니다"]],
    ["Where new agents start by default",["新智能体默认启动的位置","新代理程式預設啟動的位置","新しいエージェントを既定で開始する場所です","새 에이전트가 기본으로 시작하는 위치입니다"]],
    ["Whitespace-Only Suggestions",["仅空白变更建议","僅限空白字元的建議","空白のみの変更候補","공백만 변경하는 제안"]],
    ["Wide",["宽","寬","広い","넓게"]],
    ["Window Restoration",["窗口恢复","視窗復原","ウィンドウの復元","창 복원"]],
    ["Words that send your prompt while you dictate. Voice chats ignore them.",["听写时用于发送提示词的关键词。语音聊天会忽略这些词。","聽寫時用于發送提示詞的關鍵詞。語音聊天會忽略這些詞。","音声入力中にプロンプトを送信するためのキーワードです。音声チャットでは使われません。","받아쓰기 중 프롬프트를 전송하는 키워드입니다. 음성 채팅에서는 사용하지 않습니다."]],
    ["Working",["运行中","執行中","作業中","작업 중"]],
    ["Worktree Cleanup",["工作树清理","工作樹清理","ワークツリーのクリーンアップ","워크트리 정리"]],
    ["Worktrees",["工作树","工作樹","ワークツリー","워크트리"]],
    ["Wrap long lines in Agent conversation code blocks",["在智能体对话的代码块中自动折行","在代理程式對話的程式碼塊中自動折行","エージェントの会話に表示されるコードブロックの長い行を折り返します","에이전트 대화의 코드 블록에서 긴 줄을 바꿉니다"]],
    ["You can configure Shell, MCP, Fetch, and Read allowlists for Auto mode. However, Auto works well without these.",["可为自动模式配置 Shell、MCP、网络获取和读取的允许列表。也可直接使用默认配置。","可為自動模式設定 Shell、MCP、網路獲取和讀取的允許清單。也可直接使用預設設定。","自動モードではシェル、MCP、取得、読み取りの許可リストを設定できます。既定の設定のままでも利用できます。","자동 모드의 셸, MCP, 가져오기 및 읽기 허용 목록을 구성할 수 있습니다. 기본 설정으로도 사용할 수 있습니다."]],
    ["Your code data will not be trained on or used to improve the product. Code may be stored to provide features such as Background Agent.",["你的代码数据不会用于模型训练或产品改进。为提供后台智能体等功能，系统可能存储代码。","你的程式碼資料不會用于模型訓練或產品改進。為提供后臺代理程式等功能，系統可能存儲程式碼。","コードデータはトレーニングや製品改善には使用されません。バックグラウンドエージェントなどの機能提供のために保存される場合があります。","코드 데이터는 학습이나 제품 개선에 사용되지 않습니다. 백그라운드 에이전트 등의 기능을 제공하기 위해 코드가 저장될 수 있습니다."]],
    ["Your meetings in your workflow. Granola gives Cursor access to what your team discussed, decided, and committed to.",["在工作流程中使用会议内容。Granola 让 Cursor 访问团队的讨论、决策和承诺。","在工作流程中使用會議內容。Granola 讓 Cursor 訪問團隊的討論、決策和承諾。","会議の内容を作業に活用できます。Granola を通じて、チームの議論、決定事項、合意した対応を Cursor から参照できます。","회의 내용을 워크플로에 활용합니다. Granola를 통해 Cursor에서 팀의 논의 내용, 결정 사항 및 합의한 조치를 확인할 수 있습니다."]],
    ["Zoom",["缩放","縮放","ズーム","확대/축소"]],
    ["Zoom In",["放大","放大","拡大","확대"]],
    ["Zoom Out",["缩小","縮小","縮小","축소"]],
    ["Default",["默认","預設","既定","기본값"],["默认值"]],
    ["Disable",["停用","停用","無効にする","사용 안 함"],["禁用"]],
    ["Inherit from parent",["继承上级设置","繼承上層設定","親の設定を継承","상위 설정 상속"]],
    ["Fast",["快速","快速","高速","빠름"]],
    ["Search models",["搜索模型","搜尋模型","モデルを検索","모델 검색"]],
    ["Model selection",["选择模型","選擇模型","モデルの選択","모델 선택"]],
    ["Add Custom Model",["添加自定义模型","新增自訂模型","カスタムモデルを追加","사용자 지정 모델 추가"]],
    ["No models found",["未找到模型","找不到模型","モデルが見つかりません","모델을 찾을 수 없음"]],
    ["High Fast",["高 · 快速","高 · 快速","強・高速","높음 · 빠름"]],
    ["Medium Fast",["中 · 快速","中 · 快速","中・高速","중간 · 빠름"]],
    ["Low Fast",["低 · 快速","低 · 快速","低・高速","낮음 · 빠름"]],
  ]; // End Cursor locale data
  const homeTips = new Map([
    ["Use /create-rule to control agent behavior through system-level instructions",["使用 /create-rule 通过系统级指令控制智能体的行为","使用 /create-rule 透過系統級指令控制代理程式的行為","/create-rule でシステムレベルの指示を追加し、エージェントの動作を制御できます","/create-rule로 시스템 수준 지시를 추가하여 에이전트의 동작을 제어합니다"]],
    ["Use @browser to inspect page elements, view console logs, and analyze network traffic",["使用 @browser 检查页面元素、查看控制台日志和分析网络流量","使用 @browser 檢查頁面元素、查看主控台記錄與分析網路流量","@browser でページ要素、コンソールログ、ネットワークトラフィックを確認できます","@browser로 페이지 요소와 콘솔 로그를 확인하고 네트워크 트래픽을 분석합니다"]],
    ["Use /create-subagent to set up specialized agents that Cursor can use to parallelize work",["使用 /create-subagent 设置专用子智能体，让 Cursor 并行处理任务","使用 /create-subagent 設定專用子代理程式，讓 Cursor 平行處理工作","/create-subagent で専門のサブエージェントを設定し、Cursor で作業を並列化できます","/create-subagent로 전문 하위 에이전트를 설정하여 Cursor가 작업을 병렬로 처리하도록 합니다"]],
    ["Tell Cursor to use subagents to break down tasks, do work in parallel, and preserve context",["让 Cursor 使用子智能体拆解任务、并行处理工作并保留上下文","讓 Cursor 使用子代理程式拆解任務、平行處理工作並保留上下文","Cursor に指示して、サブエージェントにタスクを分け、コンテキストを保ちながら並行して作業できます","Cursor에 하위 에이전트를 사용하도록 지시하면 작업을 나누어 컨텍스트를 유지하며 병렬로 처리할 수 있습니다"]],
    ["Use /create-skill to customize Cursor for your workflows",["使用 /create-skill 为你的工作流程自定义 Cursor","使用 /create-skill 配合你的工作流程自訂 Cursor","/create-skill で作業の流れに合わせて Cursor をカスタマイズできます","/create-skill로 워크플로에 맞게 Cursor를 사용자 지정합니다"]],
    ["Agent skills help you customize Cursor for your workflows - use /create-skill to get started",["智能体技能可让 Cursor 适配你的工作流程，使用 /create-skill 开始","代理程式技能可讓 Cursor 配合你的工作流程，使用 /create-skill 開始","エージェントのスキルで作業の流れに合わせて Cursor をカスタマイズできます。/create-skill で始めてください","에이전트 스킬로 워크플로에 맞게 Cursor를 사용자 지정할 수 있습니다. /create-skill로 시작하세요"]],
    ["Debug Mode reproduces and solves your most difficult bugs - hit shift+tab twice to get started",["调试模式可复现并解决难查的错误，按两次 Shift+Tab 开始","偵錯模式可重現並解決難以追查的錯誤，按兩次 Shift+Tab 開始","デバッグモードでは難しいバグを再現して修正できます。Shift+Tab を2回押してください","디버그 모드는 어려운 버그를 재현하고 해결합니다. Shift+Tab을 두 번 눌러 시작하세요"]],
    ["Use /debug to solve bugs that are hard to reproduce or understand",["使用 /debug 解决难以复现或定位的错误","使用 /debug 解決難以重現或定位的錯誤","/debug で再現や原因の特定が難しいバグを調査できます","/debug로 재현하거나 이해하기 어려운 버그를 해결합니다"]],
    ["Ask Mode uses read-only agents to research your codebase - hit shift+tab to get started",["问答模式用只读智能体研究代码库，按 Shift+Tab 开始","問答模式使用唯讀代理程式研究程式碼庫，按 Shift+Tab 開始","質問モードでは読み取り専用のエージェントがコードベースを調査します。Shift+Tab を押してください","질문 모드는 읽기 전용 에이전트로 코드베이스를 조사합니다. Shift+Tab을 눌러 시작하세요"]],
    ["Use /ask to research your codebase before starting code changes",["使用 /ask 在修改代码前先了解代码库","使用 /ask 在變更程式碼前先了解程式碼庫","/ask でコードを変更する前にコードベースを調査できます","/ask로 코드 변경을 시작하기 전에 코드베이스를 조사합니다"]],
    ["Configure MCPs in your Cursor Settings to give agents access to tools and data",["在 Cursor 设置中配置 MCP，让智能体访问工具和数据","在 Cursor 設定中設定 MCP，讓代理程式存取工具與資料","Cursor の設定で MCP を設定すると、エージェントがツールやデータにアクセスできます","Cursor 설정에서 MCP를 구성하면 에이전트가 도구와 데이터에 접근할 수 있습니다"]],
    ["Use /cloud or /local to move agent sessions between runtimes",["使用 /cloud 或 /local 在云端和本地之间切换智能体会话","使用 /cloud 或 /local 在雲端與本機之間切換代理程式工作階段","/cloud または /local でエージェントのセッションをクラウドとローカルの間で移動できます","/cloud 또는 /local로 에이전트 세션을 클라우드와 로컬 간에 이동합니다"]],
    ["Use /cloud to run agents remotely for better parallelization and durable execution",["使用 /cloud 在远程运行智能体，提高并行能力并让任务持续执行","使用 /cloud 在遠端執行代理程式，提高平行處理能力並讓工作持續執行","/cloud でエージェントをリモート実行し、並列化と長時間の実行を行えます","/cloud로 에이전트를 원격 실행하여 병렬 처리와 지속적인 실행을 지원합니다"]],
    ["Use /in-cloud to start a subagent in its own cloud VM, keeping your local workspace free",["使用 /in-cloud 在独立云端虚拟机中运行子智能体，释放本地工作区","使用 /in-cloud 在獨立的雲端虛擬機上執行子代理程式，將本機工作區留給其他工作","/in-cloud でサブエージェントを専用クラウド VM で実行し、ローカルのワークスペースを空けておけます","/in-cloud로 하위 에이전트를 별도 클라우드 VM에서 실행하면 로컬 작업 영역을 비워 둘 수 있습니다"]],
    ["Use automations to save time on repetitive tasks with always-on agents",["用自动化让常驻智能体处理重复任务，节省时间","透過自動化讓常駐代理程式處理重複的任務，節省時間","自動化で常時稼働のエージェントに反復作業を任せ、時間を節約できます","자동화로 상시 실행 에이전트에 반복 작업을 맡겨 시간을 절약합니다"]],
    ["Use /loop to run a prompt on a schedule",["使用 /loop 按计划运行提示词","使用 /loop 依排程執行提示詞","/loop でスケジュールに従ってプロンプトを実行できます","/loop로 일정에 따라 프롬프트를 실행합니다"]],
    ["Use /automate to create Cursor Automations without leaving your agent chat",["使用 /automate 在当前智能体聊天中创建 Cursor 自动化","使用 /automate 在目前的代理程式對話中建立 Cursor 自動化","/automate でエージェントチャットを開いたまま Cursor の自動化を作成できます","/automate로 에이전트 채팅에서 바로 Cursor 자동화를 만듭니다"]],
    ["Use /model to pick the best model for your task and select Grok for a great balance of cost vs. capability",["使用 /model 为任务选择合适的模型；Grok 兼顾成本和能力","使用 /model 為工作選擇適合的模型；Grok 兼顧成本與能力","/model でタスクに合ったモデルを選択できます。Grok はコストと能力のバランスに優れています","/model로 작업에 적합한 모델을 선택합니다. Grok은 비용과 기능의 균형이 좋습니다"]],
    ["Hooks let you control and extend the agent loop - use /create-hook to get started",["钩子可控制和扩展智能体的运行流程，使用 /create-hook 开始","掛鉤可控制與擴充代理程式的執行流程，使用 /create-hook 開始","フックでエージェントの処理を制御・拡張できます。/create-hook で始めてください","훅으로 에이전트의 처리 흐름을 제어하고 확장할 수 있습니다. /create-hook로 시작하세요"]],
    ["Use /create-hook to control and extend the agent loop with custom scripts",["使用 /create-hook 通过自定义脚本控制和扩展智能体的运行流程","使用 /create-hook 透過自訂指令碼控制與擴充代理程式的執行流程","/create-hook でカスタムスクリプトを使ってエージェントの処理を制御・拡張できます","/create-hook로 사용자 지정 스크립트를 사용해 에이전트의 처리 흐름을 제어하고 확장합니다"]],
    ["Cursor can respond with interactive visualizations alongside text - use /canvas to get started",["Cursor 可同时返回文字和交互式可视化内容，使用 /canvas 开始","Cursor 可同時回覆文字與互動式視覺化內容，使用 /canvas 開始","Cursor はテキストとインタラクティブな可視化を一緒に返せます。/canvas で始めてください","Cursor는 텍스트와 인터랙티브 시각화를 함께 응답할 수 있습니다. /canvas로 시작하세요"]],
    ["Use /canvas to get interactive visualizations like dashboards from Cursor",["使用 /canvas 让 Cursor 生成仪表板等交互式可视化内容","使用 /canvas 讓 Cursor 產生儀表板等互動式視覺化內容","/canvas で Cursor にダッシュボードなどのインタラクティブな可視化を作成させられます","/canvas로 Cursor가 대시보드 같은 인터랙티브 시각화를 만들도록 합니다"]],
    ["Use /shell to run commands in the terminal",["使用 /shell 在终端运行命令","使用 /shell 在終端機執行指令","/shell でターミナルからコマンドを実行できます","/shell로 터미널에서 명령을 실행합니다"]],
    ["Use /simplify to have Cursor review all changed files for code quality and efficiency",["使用 /simplify 让 Cursor 检查所有已更改文件的代码质量和效率","使用 /simplify 讓 Cursor 檢查所有已變更檔案的程式碼品質與效率","/simplify で Cursor に変更したすべてのファイルのコード品質と効率を確認させられます","/simplify로 Cursor가 변경된 모든 파일의 코드 품질과 효율성을 검토하도록 합니다"]],
    ["Use /review to have Cursor find bugs, regressions, security issues, and missing tests",["使用 /review 让 Cursor 查找缺陷、回归问题、安全隐患和缺失的测试","使用 /review 讓 Cursor 找出錯誤、回歸問題、安全性問題與缺漏的測試","/review で Cursor に不具合、リグレッション、セキュリティ上の問題、不足しているテストを見つけてもらえます","/review로 Cursor가 버그, 회귀, 보안 문제 및 누락된 테스트를 찾도록 합니다"]],
    ["Use /babysit to triage PR comments, fix CI failures, and clear conflicts",["使用 /babysit 处理拉取请求评论、修复 CI 失败并解决冲突","使用 /babysit 處理提取要求的留言、修正 CI 失敗並解決衝突","/babysit でプルリクエストのコメントを整理し、CI の失敗や競合を解消できます","/babysit로 PR 댓글을 정리하고 CI 실패와 충돌을 해결합니다"]],
    ["After long sessions, use /split-to-prs to turn your work into small, reviewable PRs",["长时间工作后，使用 /split-to-prs 把改动拆成便于审查的小型拉取请求","長時間工作後，使用 /split-to-prs 將變更拆成易於審查的小型提取要求","長い作業の後に /split-to-prs を使うと、変更をレビューしやすい小さなプルリクエストに分割できます","장시간 작업한 후 /split-to-prs로 변경 사항을 검토하기 쉬운 작은 PR로 나눕니다"]],
    ["Use /add-plugin to install a plugin from the Cursor Marketplace",["使用 /add-plugin 从 Cursor 插件市场安装插件","使用 /add-plugin 從 Cursor 外掛市集安裝外掛程式","/add-plugin で Cursor マーケットプレイスからプラグインをインストールできます","/add-plugin으로 Cursor 마켓플레이스에서 플러그인을 설치합니다"]],
    ["Plugins help you customize Cursor for your workflows - use /add-plugin to get started",["插件可让 Cursor 适配你的工作流程，使用 /add-plugin 开始","外掛程式可讓 Cursor 配合你的工作流程，使用 /add-plugin 開始","プラグインで作業の流れに合わせて Cursor をカスタマイズできます。/add-plugin で始めてください","플러그인으로 워크플로에 맞게 Cursor를 사용자 지정할 수 있습니다. /add-plugin으로 시작하세요"]],
    ["Create a Project to give agents a shared assignment and track their progress in one place",["创建项目，为多个智能体分配共同任务并在同一处查看进度","建立專案，為多個代理程式分配共同任務並在同一處查看進度","プロジェクトを作成して複数のエージェントに共通の作業を割り当て、進捗をまとめて確認できます","프로젝트를 만들어 에이전트에 공동 작업을 할당하고 한곳에서 진행 상황을 추적합니다"]],
    ["Drag and drop agent chats to split your view into tiled panes",["拖放智能体聊天，将视图拆分为平铺窗格","拖放代理程式對話，將檢視拆分為並排窗格","エージェントのチャットをドラッグして、ビューを並べて表示するペインに分割できます","에이전트 채팅을 끌어 놓으면 화면이 나란히 배치된 창으로 분할됩니다"]],
    ["Ask Cursor to find a prior conversation, or summarize across conversations",["让 Cursor 查找以前的对话，或综合多条对话生成摘要","讓 Cursor 尋找先前的對話，或彙整多則對話產生摘要","Cursor に過去の会話を探したり、複数の会話をまとめたりするよう依頼できます","Cursor에 이전 대화를 찾거나 여러 대화를 요약하도록 요청할 수 있습니다"]],
    ["Voice mode lets you dictate better prompts for your agents",["使用语音模式，为智能体口述更完整的提示词","使用語音模式，為代理程式口述更完整的提示詞","音声モードでは、エージェントへの指示を声で詳しく伝えられます","음성 모드에서는 에이전트에 보낼 프롬프트를 음성으로 더 자세히 입력할 수 있습니다"]],
    ["Use /review for an agentic code review of your changes",["使用 /review 让智能体审查你的代码改动","使用 /review 讓代理程式審查你的程式碼變更","/review でエージェントにコードの変更をレビューさせられます","/review로 에이전트가 코드 변경 사항을 검토하도록 합니다"]],
    ["Use /goal to set an objective that Cursor keeps pursuing until it is complete",["使用 /goal 设置目标，让 Cursor 持续推进直到完成","使用 /goal 設定目標，讓 Cursor 持續推進直到完成","/goal で Cursor が完了まで取り組む目標を設定できます","/goal로 Cursor가 완료할 때까지 계속 진행할 목표를 설정합니다"]],
    ["Goals keep agents working across turns until the job is done - use /goal to get started",["目标可让智能体跨轮次持续工作直到完成，使用 /goal 开始","目標可讓代理程式跨回合持續進行直到完成，使用 /goal 開始","目標を設定するとエージェントが複数のターンにわたって完了まで取り組みます。/goal で始めてください","목표를 설정하면 에이전트가 여러 턴에 걸쳐 완료까지 작업을 계속합니다. /goal로 시작하세요"]],
    ["Steer a running agent without stopping it - set New Messages to Send Immediately in your Agents settings",["在智能体设置中将「新消息」设为「立即发送」，即可在不中断运行的情况下引导智能体","在代理程式設定中將「新訊息」設為「立即傳送」，即可在不中斷執行時引導代理程式","エージェントを止めずに指示を追加するには、エージェント設定の「新しいメッセージ」を「すぐに送信」にします","실행 중인 에이전트를 멈추지 않고 지시하려면 에이전트 설정에서 ‘새 메시지’를 ‘즉시 보내기’로 설정합니다"]],
    ["Messages sent while Cursor is working can steer it mid-run without interrupting - turn it on under New Messages in Agents settings",["可在智能体设置的「新消息」中开启运行中引导，发消息时无需中断当前任务","可在代理程式設定的「新訊息」中開啟執行中引導，傳送訊息時不用中斷目前工作","エージェント設定の「新しいメッセージ」を設定すると、Cursor の作業を止めずに追加の指示を送れます","에이전트 설정의 ‘새 메시지’에서 기능을 켜면 Cursor의 작업을 중단하지 않고 추가 지시를 보낼 수 있습니다"]],
    ["Tip dismissed. You can turn off future tips in Settings",["已关闭本条提示。可在设置中关闭后续提示。","已關閉這則提示。可在設定中關閉後續提示。","このヒントを閉じました。今後のヒントは設定でオフにできます。","이 팁을 닫았습니다. 설정에서 이후 팁을 끌 수 있습니다."]],
  ]);
  const composerPlaceholders = new Map([
    ["Plan, Build, / for skills, @ for context",["规划或构建，按 / 使用技能，按 @ 添加上下文","規劃或建置，按 / 使用技能，按 @ 新增上下文","計画・実装、/ でスキル、@ でコンテキストを追加","계획 또는 빌드, /로 스킬 사용, @로 컨텍스트 추가"]],
    ["Plan, search, build anything",["制定计划、搜索或开始构建","擬定計畫、搜尋或開始建置","計画、検索、実装を始めましょう","계획, 검색 또는 빌드를 시작하세요"]],
    ["Ask, learn, brainstorm",["提问、学习或讨论想法","提問、學習或討論點子","質問、学習、ブレインストーミング","질문, 학습 또는 아이디어 논의"]],
    ["Work on explicitly added files (no tools)",["仅处理明确添加的文件（无工具）","處理明確新增的檔案（無工具）","明示的に追加したファイルを操作（ツールなし）","명시적으로 추가된 파일 작업(도구 없음)"]],
    ["Add a follow-up",["添加后续消息","新增後續訊息","フォローアップを追加","후속 메시지 추가"]],
    ["Ask follow-ups in the worktree",["在工作树中继续提问","在工作樹中繼續提問","ワークツリーで追加の質問をする","워크트리에서 후속 질문하기"]],
    ["Continue locally",["在本地继续","在本機繼續","ローカルで続ける","로컬에서 계속"]],
    ["Enter additional context about the issue",["为这个问题补充上下文","為這個問題補充上下文","問題に関する追加情報を入力","문제에 대한 추가 컨텍스트 입력"]],
    ["Reject, suggest, follow up?",["拒绝、提出建议或继续追问？","拒絕、提出建議或繼續追問？","拒否、提案、フォローアップをしますか？","거절하거나 제안 또는 후속 질문을 할까요?"]],
  ]);
  const protectedContent = [
    'pre', 'code', 'textarea', 'input', 'iframe', 'webview', '.xterm', '.monaco-editor', '[contenteditable]',
    '[data-lexical-editor]', '[data-testid*="message"]', '[data-testid*="conversation-turn"]',
    '[class*="markdown"]', '[class*="prose"]', '[role="log"]', '[role="listitem"][data-resource-uri]',
  ].join(',');
  const chrome = [
    'button', 'nav', 'aside', '[role="menu"]', '[role="menuitem"]', '[role="tab"]', '[role="toolbar"]',
    '.menubar', '.action-label', '[data-testid*="sidebar"]', '[data-testid*="navigation"]',
  ].join(',');
  const standalone = new Set(['Repositories', 'Getting Started', 'Recent', 'Projects', 'Workspaces']);
  const controlledAttributes = ['aria-label', 'aria-description', 'aria-placeholder', 'title', 'placeholder', 'data-placeholder'];
  const attributeSelector = controlledAttributes.map(field => '[' + field + ']').join(',');
  const shortcut = /^(?:(?:Ctrl|Control|Alt|Shift|Cmd|Meta|Win)\s*\+|[⌘⌥⇧⌃])/i;
  const menuDecoration = 'svg, kbd, [aria-hidden="true"], [class*="keybinding"], [class*="shortcut"]';
  const sidebarTitle = '.ui-sidebar-menu-button-label > span';
  const relativeTime = /^(\d+)(mo|w|d|h|m|s)$/;
  const timeUnits = {
    mo: ['个月', '個月', 'か月', '개월'], w: ['周', '週', '週間', '주'],
    d: ['天', '天', '日', '일'], h: ['小时', '小時', '時間', '시간'],
    m: ['分钟', '分鐘', '分', '분'], s: ['秒', '秒', '秒', '초'],
  };
  const localeOrder = ['zh-CN', 'zh-TW', 'ja', 'ko'];
  const editorLabels = new Set(['Open Cursor Settings', 'Open Command Palette']);
  const modelChoiceLabels = new Set(['Default', 'Disable', 'Inherit from parent']);
  const modelBadgeLabels = new Set(['Low', 'Medium', 'High', 'Fast', 'Low Fast', 'Medium Fast', 'High Fast']);
  const color = value => typeof value === 'string' && /^#[a-f0-9]{6}$/i.test(value) ? value : null;
  let wallpaper;
  let translated = new Map();
  let localized = new Map();
  let localeIndex = -1;
  let cursorAgents = false;
  let appearance = {};
  let key;
  let observer;
  let timer;
  let source;
  let mode;
  let launcher;
  let launcherSource;
  let drag;
  let clickSuppressed = false;

  function anchor(event) {
    const rect = launcher.getBoundingClientRect();
    globalThis.grokGuarderAnchor(JSON.stringify({
      event, X: Math.max(0, Math.round(rect.left)), Y: Math.max(0, Math.round(rect.top)),
    }));
  }

  function mountLauncher() {
    if (!launcherSource || launcher?.isConnected) return;
    launcher = document.createElement('button');
    launcher.id = launcherId;
    launcher.type = 'button';
    launcher.title = 'Grok Guarder';
    launcher.setAttribute('aria-label', 'Grok Guarder');
    const mark = document.createElement('img');
    mark.alt = '';
    mark.src = launcherSource;
    launcher.append(mark);
    launcher.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      const rect = launcher.getBoundingClientRect();
      drag = { id: event.pointerId, x: event.clientX - rect.left, y: event.clientY - rect.top,
        originX: event.clientX, originY: event.clientY, moved: false };
      clickSuppressed = false;
      launcher.setPointerCapture(event.pointerId);
    });
    launcher.addEventListener('pointermove', event => {
      if (drag?.id !== event.pointerId) return;
      if (!drag.moved && Math.hypot(event.clientX - drag.originX, event.clientY - drag.originY) < 5) return;
      drag.moved = true;
      const x = Math.min(innerWidth - 56, Math.max(8, event.clientX - drag.x));
      const y = Math.min(innerHeight - 56, Math.max(8, event.clientY - drag.y));
      launcher.style.right = (innerWidth - x - 48) + 'px';
      launcher.style.bottom = (innerHeight - y - 48) + 'px';
    });
    const endDrag = event => {
      if (drag?.id !== event.pointerId) return;
      clickSuppressed = drag.moved;
      if (drag.moved) anchor('move');
      drag = undefined;
    };
    launcher.addEventListener('pointerup', endDrag);
    launcher.addEventListener('pointercancel', endDrag);
    launcher.addEventListener('click', () => {
      if (!clickSuppressed) anchor('toggle');
      clickSuppressed = false;
    });
    document.body.append(launcher);
  }

  function originalValue(node, field, value) {
    const previous = originals.get(node)?.get(field);
    return previous && previous.last === value ? previous.original : value;
  }

  function writeField(node, field, value, baseline, next, update) {
    let fields = originals.get(node);
    if (next !== baseline) {
      if (!fields) {
        fields = new Map();
        originals.set(node, fields);
      }
      fields.set(field, { original: baseline, last: next });
      edited.add(node);
    } else if (fields) {
      fields.delete(field);
      if (!fields.size) {
        edited.delete(node);
        originals.delete(node);
      }
    }
    if (next !== value) update(next);
  }

  const normalized = word => word.replace(/[\s\u200b]+$/, '').trimStart().replace(/\s+/g, ' ');
  const dynamicLabels = [
    [/^Skip step (\d+) of (\d+)$/, '跳过第 $1 步（共 $2 步）', '略過第 $1 步（共 $2 步）', '手順 $1/$2 をスキップ', '$2단계 중 $1단계 건너뛰기'],
    [/^(\d+) tools? enabled$/, '已启用 $1 个工具', '已啟用 $1 個工具', '$1 個のツールが有効', '도구 $1개 사용 중'],
    [/^(\d+) tools?, (\d+) resources? enabled$/, '已启用 $1 个工具、$2 项资源', '已啟用 $1 個工具、$2 項資源', 'ツール $1 個とリソース $2 個が有効', '도구 $1개, 리소스 $2개 사용 중'],
    [/^(\d+) sources?$/, '$1 个来源', '$1 個來源', '$1 件のソース', '원본 $1개'],
    [/^Show (\d+) more$/, '再显示 $1 项', '再顯示 $1 項', 'さらに $1 件を表示', '$1개 더 보기'],
    [/^Branch (.{1,100}), open branch menu$/, '分支 $1，打开分支菜单', '分支 $1，開啟分支選單', 'ブランチ $1、ブランチメニューを開く', '브랜치 $1, 브랜치 메뉴 열기'],
    [/^(.{1,100}), switch branch$/, '$1，切换分支', '$1，切換分支', '$1、ブランチを切り替える', '$1, 브랜치 전환'],
    [/^(.{1,100}), select project$/, '$1，选择项目', '$1，選擇專案', '$1、プロジェクトを選択', '$1, 프로젝트 선택'],
    [/^(.{1,100}), select environment$/, '$1，选择环境', '$1，選擇環境', '$1、環境を選択', '$1, 환경 선택'],
    [/^Configure (.{1,100})$/, '配置 $1', '設定 $1', '$1 を設定', '$1 구성'],
    [/^Add (.{1,100})$/, '添加 $1', '新增 $1', '$1 を追加', '$1 추가'],
    [/^(.{1,100}) options$/, '$1 的选项', '$1 的選項', '$1 のオプション', '$1 옵션'],
    [/^(.{1,100}) enabled$/, '已启用 $1', '已啟用 $1', '$1 が有効', '$1 사용 중'],
    [/^(.{1,100}) disabled$/, '已停用 $1', '已停用 $1', '$1 が無効', '$1 사용 안 함'],
    [/^Disable (.{1,100}) for (.{1,100})$/, '为 $2 停用 $1', '為 $2 停用 $1', '$2 の $1 を無効にする', '$2의 $1 사용 안 함'],
    [/^Enable (.{1,100}) for (.{1,100})$/, '为 $2 启用 $1', '為 $2 啟用 $1', '$2 の $1 を有効にする', '$2의 $1 사용'],
  ];

  function cursorLabels(locale) {
    const index = localeOrder.indexOf(locale);
    const names = new Map();
    if (index < 0 && locale !== 'en') return names;
    const aliases = new Map();
    for (const [english, variants, native = []] of [...cursorMessages, ...homeTips, ...composerPlaceholders]) {
      const label = index < 0 ? english : variants[index];
      if (!label) continue;
      names.set(english, label);
      for (const alias of [variants[0], ...native]) {
        if (!alias || alias === english) continue;
        if (!aliases.has(alias)) aliases.set(alias, label);
        else if (aliases.get(alias) !== label) aliases.set(alias, null);
      }
    }
    for (const [alias, label] of aliases) if (label && !names.has(alias)) names.set(alias, label);
    return names;
  }

  function isCursorLabel(word, english) {
    const localizedWord = localized.get(english);
    return word === english || word === localizedWord
      || (localizedWord && localized.get(word) === localizedWord);
  }

  function isTaskModelGroup(element) {
    const group = element.closest('[role="group"][aria-label]');
    return group && isCursorLabel(originalValue(group, 'aria-label', group.getAttribute('aria-label')), 'Task Models');
  }

  function isModelInterfaceText(element, word) {
    if (modelChoiceLabels.has(word) && element.closest('button[role="combobox"]') && isTaskModelGroup(element)) return true;
    if (!element.closest('[role="option"] .ui-model-picker__item-content-name')) return false;
    return modelChoiceLabels.has(word) || (modelBadgeLabels.has(word) && element.matches('span'));
  }

  function findTranslation(word, dynamic = false) {
    if (cursorAgents && word === 'Cursor') return;
    const exact = ((cursorAgents || editorLabels.has(word)) && localized.get(word)) || translated.get(word);
    if (exact || !dynamic || localeIndex < 0) return exact;
    const time = relativeTime.exec(word);
    if (time && dynamic === 'time') {
      const unit = timeUnits[time[2]][localeIndex];
      return localeIndex === 3 ? time[1] + unit + ' 전' : time[1] + unit + '前';
    }
    for (const [pattern, ...replacements] of dynamicLabels) {
      if (pattern.test(word)) return word.replace(pattern, replacements[localeIndex]);
    }
  }

  function applyField(node, field, value, update, localize, dynamic = false) {
    const baseline = originalValue(node, field, value);
    if (baseline === null) return;
    const word = normalized(baseline);
    const result = localize && findTranslation(word, dynamic);
    const next = result ? baseline.replace(baseline.trim(), result) : baseline;
    writeField(node, field, value, baseline, next, update);
  }

  function groupText(element, matches, handled, ignored, preserveShortcuts = true) {
    if (!element) return;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const parts = [];
    let node;
    while ((node = walker.nextNode())) {
      if (handled.has(node) || node.parentElement.closest(ignored)) continue;
      const baseline = originalValue(node, 'text', node.data);
      if (preserveShortcuts && shortcut.test(baseline.trim())) continue;
      parts.push({ node, baseline });
    }
    if (parts.length < 2) return;
    const result = matches(normalized(parts.map(part => part.baseline).join('')), parts);
    if (!result) return;
    for (const [index, { node, baseline }] of parts.entries()) {
      const next = result[index] ?? '';
      handled.add(node);
      writeField(node, 'text', node.data, baseline, next, value => { node.data = value; });
    }
  }

  function translateTip(label, parts) {
    if (!homeTips.has(label)) return;
    const message = findTranslation(label);
    if (!message) return;
    const result = [];
    let firstText = 0;
    let start = 0;
    for (const [index, part] of parts.entries()) {
      const command = part.baseline.trim();
      if (!/^(?:\/|@)[a-z][a-z\d-]*$/i.test(command)) continue;
      const position = message.indexOf(command, start);
      if (position < 0 || (index === firstText && position !== start)) return [message];
      if (index > firstText) result[firstText] = message.slice(start, position);
      result[index] = command;
      firstText = index + 1;
      start = position + command.length;
    }
    if (start < message.length && firstText >= parts.length) return [message];
    result[firstText] = message.slice(start);
    return result;
  }

  function translateGroups(handled) {
    for (const item of document.querySelectorAll('[role="menuitem"]')) {
      for (const candidate of [...item.children, item]) {
        groupText(candidate, (label, parts) => {
          const result = findTranslation(label);
          if (!result) return;
          const index = parts.findIndex(part => part.baseline.trim().length > 1);
          return { [Math.max(0, index)]: result };
        }, handled, menuDecoration + ',' + protectedContent);
      }
    }
    if (localeIndex < 0 || !cursorAgents) return;
    // The home screen keeps a source copy and a separate animated copy of each tip.
    const tips = '.glass-agent-drop-target :is(span.ui-text:not(.ui-text-roll), .ui-text-roll__item)';
    for (const hint of document.querySelectorAll(tips)) {
      groupText(hint, translateTip, handled, protectedContent + ',script,style,svg', false);
    }
  }

  function agentsWindow() {
    return [...document.body.children].some(element => typeof element.className === 'string'
      && element.className.startsWith('glass-') && element.getBoundingClientRect().height > innerHeight * .55);
  }

  function translate() {
    for (const node of edited) {
      if (!node.isConnected) edited.delete(node);
    }
    const localizing = translated.size || localized.size;
    if (!localizing && !edited.size) return;
    cursorAgents = agentsWindow();
    const inSettings = cursorAgents && [...document.querySelectorAll('button[aria-label]')].some(button =>
      isCursorLabel(originalValue(button, 'aria-label', button.getAttribute('aria-label')), 'Close Settings'));
    const handled = new Set();
    if (localizing) translateGroups(handled);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const element = node.parentElement;
      if (!element || handled.has(node)) continue;
      const word = normalized(originalValue(node, 'text', node.data));
      let dynamic = cursorAgents && /^(?:\d+ (?:tools?|sources?)|Show \d+ more)/.test(word);
      if (cursorAgents && relativeTime.test(word) && element.closest('time,.ui-sidebar-menu-button,[role="option"]')) dynamic = 'time';
      if (!originals.has(node) && !findTranslation(word, dynamic)) continue;
      const protectedTitle = !inSettings && !/^(?:No Repo|New Chat|Automations|Customize)$/.test(word)
        && element.closest(sidebarTitle);
      const localize = !protectedTitle && (!element.closest(protectedContent + ',script,style,svg')
        || (cursorAgents && isModelInterfaceText(element, word)))
        && (cursorAgents || element.closest(chrome) || standalone.has(word));
      applyField(node, 'text', node.data, next => { node.data = next; }, localize, dynamic);
    }
    for (const element of document.querySelectorAll(attributeSelector)) {
      if (element.closest('pre,code,iframe,webview,.xterm,.monaco-editor,[class*="markdown"],[role="log"]')) continue;
      for (const field of controlledAttributes) {
        const value = element.getAttribute(field);
        if (value === null || (!originals.get(element)?.has(field) && !findTranslation(normalized(value), cursorAgents))) continue;
        const editorPlaceholder = field === 'data-placeholder' && element.matches('.ui-prompt-input-editor__input .is-editor-empty');
        const localize = !editorPlaceholder && (cursorAgents || field === 'placeholder' || field === 'aria-placeholder'
          || field === 'data-placeholder' || element.matches(chrome));
        applyField(element, field, value, next => element.setAttribute(field, next), localize, cursorAgents);
      }
    }
  }

  function markSurfaces() {
    if (!source) return;
    const viewWidth = innerWidth;
    const viewHeight = innerHeight;
    const glass = [...document.body.children].filter(node => typeof node.className === 'string'
      && node.className.startsWith('glass-') && node.getBoundingClientRect().width > viewWidth * .55
      && node.getBoundingClientRect().height > viewHeight * .55);
    const standard = document.querySelector('.monaco-workbench');
    const shells = glass.length ? glass : standard ? [standard] : [];
    for (const root of shells) {
      root.setAttribute(surface, 'clear');
      marked.add(root);
      if (!glass.length) continue;
      const queue = [[root, 0]];
      while (queue.length) {
        const [parent, depth] = queue.shift();
        if (depth >= 9) continue;
        for (const candidate of parent.children) {
          if (candidate.matches(protectedContent + ',[role="dialog"],[role="menu"]')) continue;
          const bounds = candidate.getBoundingClientRect();
          if (bounds.height < viewHeight * .30 || bounds.width < Math.min(viewWidth * .13, 170)) continue;
          if (!marked.has(candidate)) {
            const original = getComputedStyle(candidate).backgroundColor;
            if (original !== 'rgba(0, 0, 0, 0)' && original !== 'transparent') {
              candidate.style.setProperty('--grok-guarder-surface-color', original);
              candidate.setAttribute(surface, bounds.width >= viewWidth * .78 ? 'clear' : 'pane');
              marked.add(candidate);
            }
          }
          queue.push([candidate, depth + 1]);
        }
      }
    }
    // Agents uses generated layout classes. Start from paint layers at fixed viewport points
    // so the wallpaper remains visible when Cursor rearranges its shell containers.
    if (glass.length) {
      for (const [x, y] of [[.10,.25],[.10,.65],[.32,.25],[.57,.17],[.63,.42],[.82,.28],[.84,.77],[.94,.52]]) {
        for (const node of document.elementsFromPoint(viewWidth * x, viewHeight * y)) {
          if (!node.matches('div,main,section,aside') || node.id === id
            || !glass.some(root => root.contains(node)) || node.closest(protectedContent + ',[role="dialog"],[role="menu"]')) continue;
          const bounds = node.getBoundingClientRect();
          if (bounds.height < viewHeight * .25 || bounds.width < Math.min(viewWidth * .14, 180)) continue;
          if (marked.has(node)) continue;
          const paint = getComputedStyle(node);
          if (paint.backgroundColor === 'rgba(0, 0, 0, 0)' && paint.backgroundImage === 'none') continue;
          node.style.setProperty('--grok-guarder-surface-color', paint.backgroundColor);
          node.setAttribute(surface, bounds.width >= viewWidth * .48 ? 'clear' : 'pane');
          marked.add(node);
        }
      }
    }
  }

  function clearSurfaces() {
    for (const node of marked) {
      node.removeAttribute(surface);
      node.style.removeProperty('--grok-guarder-surface-color');
    }
    marked.clear();
  }

  function paintToolbarIcons(root, onCard, icons) {
    const controls = 'button,[role="button"],[role="tab"],a[href],.action-label';
    const sidebar = '.ui-sidebar-top-bar,.ui-sidebar-header,.ui-sidebar-group-label,.ui-sidebar-section';
    const toolbars = '.part.titlebar,.pane-header,.editor-actions,[role="toolbar"]';
    const ignored = protectedContent + ',[role="dialog"],[role="menu"],[role="tooltip"]';
    const currentColor = '[stroke="currentColor" i],[fill="currentColor" i]';
    for (const icon of root.querySelectorAll('.ui-icon,.codicon,svg,' + statusDot)) {
      if (icon.closest(ignored)) continue;
      // Agents draws several navigation and repository glyphs beside the button.
      if (!icon.closest(sidebar)) {
        const control = icon.closest(controls);
        if (!control || !icon.getClientRects().length) continue;
        const bounds = control.getBoundingClientRect();
        const aria = originalValue(control, 'aria-label', control.getAttribute('aria-label')) || '';
        const composerPicker = control.matches('.ui-select-trigger') && /(?:select project|open branch menu|select environment)$/.test(aria);
        if (bounds.bottom <= 0 || (bounds.top >= 100 && !composerPicker && !control.closest(toolbars))) continue;
      }
      if (icon.matches('svg') && !icon.matches(currentColor) && !icon.querySelector(currentColor)) continue;
      if (!onCard(icon)) icons.add(icon);
    }
  }

  function paintText() {
    const next = new Set();
    const nextIcons = new Set();
    if (source && color(appearance.fontColor)) {
      const backgrounds = new Map();
      const agents = [...document.body.children].filter(node => typeof node.className === 'string'
        && node.className.startsWith('glass-') && node.getBoundingClientRect().height > innerHeight * .55);
      const scopes = agents.length ? agents : document.querySelectorAll(
        '.monaco-workbench :is(.part.titlebar,.part.activitybar,.part.sidebar,.part.auxiliarybar,.part.panel,.part.editor)'
      );
      const excluded = protectedContent + ',script,style,svg,[role="dialog"],[role="tooltip"]';
      for (const root of scopes) {
        const onCard = element => {
          if (!element || element === document.body) return false;
          if (backgrounds.has(element)) return backgrounds.get(element);
          const background = getComputedStyle(element).backgroundColor;
          const explicitAlpha = background.match(/(?:\/|rgba\([^)]*,)\s*([\d.]+)(%)?\)$/);
          const alpha = explicitAlpha ? Number(explicitAlpha[1]) / (explicitAlpha[2] ? 100 : 1)
            : background === 'transparent' ? 0 : 1;
          const backed = alpha >= .68 || (element !== root && onCard(element.parentElement));
          backgrounds.set(element, backed);
          return backed;
        };
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            if (node.nodeType === Node.ELEMENT_NODE) return node.matches(excluded) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
            return node.data.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
          },
        });
        let node;
        while ((node = walker.nextNode())) {
          const element = node.parentElement;
          if (!next.has(element) && element.getClientRects().length && !onCard(element)) next.add(element);
        }
        paintToolbarIcons(root, onCard, nextIcons);
        if (!agents.length) continue;
        for (const name of root.querySelectorAll('[role="group"] button[role="combobox"] .ui-markdown__paragraph')) {
          if (isTaskModelGroup(name) && name.getClientRects().length && !onCard(name)) next.add(name);
        }
        for (const input of root.querySelectorAll('input[placeholder]')) {
          const label = originalValue(input, 'placeholder', input.getAttribute('placeholder'));
          const modelSearch = isCursorLabel(label, 'Add or search model');
          if (!modelSearch && !isCursorLabel(label, 'Search Settings')) continue;
          if (input.getClientRects().length && !onCard(input)) next.add(input);
          if (!modelSearch) continue;
          // Cursor renders model names as markdown inside the settings rows.
          const group = input.closest('fieldset.ui-field-group');
          if (!group) continue;
          for (const name of group.querySelectorAll(
            '.ui-field-group__entry:has([role="switch"]) .ui-field-group__entry-label .ui-markdown__paragraph'
          )) {
            if (name.getClientRects().length && !onCard(name)) next.add(name);
          }
        }
      }
    }
    for (const element of paintedText) if (!next.has(element)) element.removeAttribute(textInk);
    for (const element of next) if (!paintedText.has(element)) element.setAttribute(textInk, '');
    paintedText = next;
    for (const icon of paintedIcons) if (!nextIcons.has(icon)) icon.removeAttribute(iconInk);
    for (const icon of nextIcons) {
      if (!paintedIcons.has(icon)) icon.setAttribute(iconInk, icon.matches(statusDot) ? 'status' : 'glyph');
    }
    paintedIcons = nextIcons;
  }

  function updateCSS() {
    const ratio = (value, fallback) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : fallback));
    const body = document.body;
    const opacity = ratio(appearance.opacity, .72) * .80;
    const sidebar = ratio(appearance.sidebarOpacity, .72) * .68;
    const base = 'var(--vscode-editor-background, #faf9fa)';
    const foreground = color(appearance.fontColor);
    const channels = foreground?.slice(1).match(/../g).map(hex => parseInt(hex, 16));
    const outline = channels && channels[0] * .299 + channels[1] * .587 + channels[2] * .114 > 135
      ? '#080a0c' : '#f8f9fb';
    const input = color(appearance.composerBackgroundColor);
    const scale = 0.65 + Math.min(100, Math.max(0, Number.isFinite(appearance.zoom) ? appearance.zoom : 35)) / 100;
    const blur = Math.min(100, Math.max(0, Number.isFinite(appearance.blurPx) ? appearance.blurPx : 0));
    const iconCSS = `
      #${launcherId} { position:fixed; right:22px; bottom:24px; z-index:2147483000;
        width:48px; height:48px; padding:0; border:0; border-radius:50%; overflow:hidden;
        background:#080808; cursor:grab; touch-action:none; }
      #${launcherId} img { width:100%; height:100%; object-fit:contain; display:block; pointer-events:none; }
      #${launcherId}:active { cursor:grabbing; }
    `;
    // Tiptap owns data-placeholder and rewrites it when the editor updates.
    const promptCSS = localeIndex < 0 ? '' : [...composerPlaceholders].map(([word, variants]) =>
      '.ui-prompt-input-editor__input .is-editor-empty[data-placeholder=' + JSON.stringify(word) +
      ']::before { content: ' + JSON.stringify(variants[localeIndex]) + ' / "" !important; }'
    ).join('\n');
    style.textContent = iconCSS + promptCSS + (!source ? '' : `
      body[data-grok-guarder-wallpaper] { isolation:isolate; background-color:transparent !important; }
      body[data-grok-guarder-wallpaper] > #${id} {
        position:fixed; inset:0; z-index:-1; overflow:hidden; pointer-events:none;
        background:${base};
      }
      #${id} img, #${id} video { display:block; width:100%; height:100%; object-fit:cover;
        filter:blur(${blur}px); transform:scale(${scale}); }
      #${id}::after { content:''; position:absolute; inset:0; background:rgba(0,0,0,${ratio(appearance.scrimOpacity,.2)}); }
      body[data-grok-guarder-wallpaper] [${surface}="clear"],
      body[data-grok-guarder-wallpaper] .monaco-workbench :is(.monaco-grid-view,.editor-group-container,.editor-instance,.part.editor > .content) {
        background-color:transparent !important; background-image:none !important;
      }
      body[data-grok-guarder-wallpaper] [${surface}="pane"] {
        background-color:color-mix(in srgb, var(--grok-guarder-surface-color,${base}) ${sidebar * 100}%, transparent) !important;
        background-image:none !important;
      }
      body[data-grok-guarder-wallpaper] .monaco-workbench :is(.part.editor,.monaco-editor,.monaco-editor-background,.monaco-editor .margin) {
        background-color:color-mix(in srgb,${base} ${opacity * 100}%,transparent) !important;
      }
      body[data-grok-guarder-wallpaper] .monaco-workbench :is(.part.sidebar,.part.auxiliarybar,.part.panel,.part.activitybar) {
        background-color:color-mix(in srgb,var(--vscode-sideBar-background,${base}) ${sidebar * 100}%,transparent) !important;
      }
      ${foreground ? `body[data-grok-guarder-wallpaper] [${textInk}],
      body[data-grok-guarder-wallpaper] input[${textInk}]::placeholder {
        color:${foreground} !important;
        -webkit-text-stroke:.7px ${outline};
        paint-order:stroke fill;
        text-shadow:0 1px 2px ${outline},0 0 3px ${outline};
      }
      body[data-grok-guarder-wallpaper] input[${textInk}]::placeholder { opacity:1 !important; }
      body[data-grok-guarder-wallpaper] [${iconInk}="glyph"] {
        color:${foreground} !important;
        text-shadow:0 1px 2px ${outline},0 0 3px ${outline};
      }
      body[data-grok-guarder-wallpaper] [${iconInk}="glyph"]::before,
      body[data-grok-guarder-wallpaper] [${iconInk}="glyph"]::after {
        color:inherit !important;
        -webkit-text-stroke:.55px ${outline};
        paint-order:stroke fill;
      }
      body[data-grok-guarder-wallpaper] svg[${iconInk}="glyph"] {
        filter:drop-shadow(0 1px 1px ${outline}) drop-shadow(0 0 1px ${outline});
      }
      body[data-grok-guarder-wallpaper] :is(:disabled,[aria-disabled="true"],.action-item.disabled)[${iconInk}="glyph"],
      body[data-grok-guarder-wallpaper] :is(:disabled,[aria-disabled="true"],.action-item.disabled) [${iconInk}="glyph"] {
        color:color-mix(in srgb, ${foreground} 67%, transparent) !important;
      }
      body[data-grok-guarder-wallpaper] [${iconInk}="status"] {
        outline:1px solid ${outline};
      }
      body[data-grok-guarder-wallpaper] .ui-agent-status-dot[data-variant="draft"] [${iconInk}="status"] {
        border-color:color-mix(in srgb, ${foreground} 82%, transparent) !important;
      }
      body[data-grok-guarder-wallpaper] .ui-agent-status-dot[data-variant="done-seen"] [${iconInk}="status"] {
        background-color:color-mix(in srgb, ${foreground} 68%, transparent) !important;
      }` : ''}
      ${input ? 'body[data-grok-guarder-wallpaper] { --vscode-input-background:' + input + '; }' : ''}
    `);
    if (style.parentNode !== document.head) document.head.append(style);
    body.toggleAttribute('data-grok-guarder-wallpaper', Boolean(source));
  }

  function setWallpaper(next) {
    const mediaUrl = next?.url;
    if (mediaUrl === source) return;
    source = mediaUrl;
    mode = next?.kind;
    wallpaper?.remove();
    wallpaper = undefined;
    clearSurfaces();
    if (!source) return;
    wallpaper = document.createElement('div');
    wallpaper.id = id;
    wallpaper.setAttribute('aria-hidden', 'true');
    const asset = document.createElement(mode === 'video' ? 'video' : 'img');
    if (asset instanceof HTMLVideoElement) {
      asset.loop = true;
      asset.autoplay = true;
      asset.muted = true;
      asset.playsInline = true;
    } else asset.alt = '';
    asset.src = source;
    wallpaper.append(asset);
    document.body.prepend(wallpaper);
  }

  function refresh() {
    if (!document.body) return;
    mountLauncher();
    translate();
    markSurfaces();
    paintText();
  }

  function watch() {
    if (observer) return;
    observer = new MutationObserver(records => {
      if (!records.some(record => {
        const element = record.target.nodeType === Node.TEXT_NODE ? record.target.parentElement : record.target;
        return element && (record.type === 'attributes' || !element.closest?.(protectedContent));
      })) return;
      clearTimeout(timer);
      timer = setTimeout(refresh, 36);
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: controlledAttributes });
    window.addEventListener('resize', refresh, { passive: true });
  }

  globalThis.grokGuarderHost = {
    dispose() {
      observer?.disconnect();
      clearTimeout(timer);
      window.removeEventListener('resize', refresh);
      translated.clear();
      localized.clear();
      localeIndex = -1;
      key = undefined;
      translate();
      setWallpaper(null);
      paintText();
      launcher?.remove();
      document.body?.removeAttribute('data-grok-guarder-wallpaper');
      style.remove();
      delete globalThis.grokGuarderHost;
    },
    inspect() {
      const node = wallpaper?.firstElementChild;
      const sample = [...paintedText].find(element => element.isConnected && element.getClientRects().length);
      return {
        locale: key, labels: edited.size, mode: agentsWindow() ? 'agents' : 'editor',
        icon: Boolean(launcher?.querySelector('img')?.naturalWidth),
        surfaces: [...marked].filter(element => element.isConnected).length,
        wallpaper: node instanceof HTMLVideoElement ? node.readyState >= 2 : Boolean(node?.naturalWidth),
        playing: node instanceof HTMLVideoElement ? node.currentTime : undefined,
        foreground: sample && getComputedStyle(sample).color,
        readableLabels: paintedText.size,
        readableIcons: paintedIcons.size,
      };
    },
    async apply(state) {
      if (!document.body) return;
      if (key !== state.locale) {
        key = state.locale;
        localeIndex = localeOrder.indexOf(key);
        localized = cursorLabels(key);
        translated = new Map(state.labels || []);
      }
      appearance = state.theme || {};
      launcherSource = state.icon;
      setWallpaper(state.media);
      updateCSS();
      const video = wallpaper?.querySelector('video');
      if (video) video.volume = Math.min(1, Math.max(0, Number(appearance.volume) || 0));
      refresh();
      watch();
      return { source, mode, labels: edited.size };
    },
  };
})();
