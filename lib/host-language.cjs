const fs = require('node:fs');
const path = require('node:path');

const locales = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko'];
const base = fs.readFileSync(path.join(__dirname, 'host-dictionary.tsv'), 'utf8')
  .replace(/^\uFEFF/, '').trim().split(/\r?\n/).map(line => line.split('\t'))
  .filter(row => row.length === locales.length);

const cursor = [
  ['New Chat', '新建聊天', '新增聊天', '新しいチャット', '새 채팅'],
  ['Automations', '自动化', '自動化', 'オートメーション', '자동화'],
  ['Customize', '自定义', '自訂', 'カスタマイズ', '사용자 지정'],
  ['Repositories', '代码仓库', '程式碼儲存庫', 'リポジトリ', '리포지토리'],
  ['No Repo', '无仓库', '無儲存庫', 'リポジトリなし', '리포지토리 없음'],
  ['Getting Started', '入门指南', '入門指南', 'はじめに', '시작하기'],
  ['This PC', '此电脑', '這部電腦', 'この PC', '이 PC'],
  ['Plan New Idea', '规划新想法', '規劃新想法', '新しいアイデアを計画', '새 아이디어 계획'],
  ['Multitask', '多任务', '多工', 'マルチタスク', '멀티태스크'],
  ['New Agent', '新建智能体', '新增代理程式', '新しいエージェント', '새 에이전트'],
  ['Open IDE', '打开编辑器', '開啟編輯器', 'IDE を開く', 'IDE 열기'],
  ['Open Folder', '打开文件夹', '開啟資料夾', 'フォルダーを開く', '폴더 열기'],
  ['Add Folder', '添加文件夹', '新增資料夾', 'フォルダーを追加', '폴더 추가'],
  ['Show Terminal', '显示终端', '顯示終端機', 'ターミナルを表示', '터미널 표시'],
  ['Maximize Chat', '最大化聊天', '最大化聊天', 'チャットを最大化', '채팅 최대화'],
  ['Selection', '选择', '選取', '選択', '선택'],
  ['Terminal', '终端', '終端機', 'ターミナル', '터미널'],
  ['Go', '转到', '移至', '移動', '이동'],
  ['Run', '运行', '執行', '実行', '실행'],
  ['Connect Slack', '连接 Slack', '連接 Slack', 'Slack に接続', 'Slack 연결'],
  ['Plan, Build, / for skills, @ for context', '规划或构建，/ 使用技能，@ 添加上下文', '規劃或建置，/ 使用技能，@ 新增上下文', '計画・実装、/ でスキル、@ でコンテキスト', '계획과 빌드, / 스킬, @ 컨텍스트'],
];

function labelsFor(locale) {
  const index = locales.indexOf(locale);
  if (index < 0) return [];
  const labels = new Map();
  for (const row of [...base, ...cursor]) {
    if (!row[index]) continue;
    for (const original of row) {
      if (original && original !== row[index]) labels.set(original, row[index]);
    }
  }
  return [...labels];
}

module.exports = { labelsFor };
