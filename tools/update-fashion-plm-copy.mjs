import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "demos", "jvision-fashion-plm");
const files = ["index.html", "index.txt", "__next._full.txt", "__next.__PAGE__.txt"]
  .map(file => path.join(root, file))
  .filter(file => fs.existsSync(file));
const replacements = [
  ["32 款式開發中", "32 款商品進行打樣與量產準備"],
  ["打樣完成率 68%，物料風險 5 筆，預估上市時間縮短 30%。", "本季商品準備度 68%，物料風險 5 筆，預估上市時間縮短 30%。"],
  ["<span>款式資料</span><strong>32</strong>", "<span>本季商品款式</span><strong>32</strong>"],
  ['children":"款式資料"},{"$","strong",null,{"children":"32', 'children":"本季商品款式"},{"$","strong",null,{"children":"32'],
  ['children\\":\\"款式資料\\"}],[\\"$\\",\\"strong\\",null,{\\"children\\":\\"32', 'children\\":\\"本季商品款式\\"}],[\\"$\\",\\"strong\\",null,{\\"children\\":\\"32'],
  ["<span>開發完成率</span><strong>68%</strong>", "<span>上市準備度</span><strong>68%</strong>"],
  ['children":"開發完成率"},{"$","strong",null,{"children":"68%', 'children":"上市準備度"},{"$","strong",null,{"children":"68%']
  ,['children\\":\\"開發完成率\\"}],[\\"$\\",\\"strong\\",null,{\\"children\\":\\"68%', 'children\\":\\"上市準備度\\"}],[\\"$\\",\\"strong\\",null,{\\"children\\":\\"68%']
];

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  for (const [from, to] of replacements) content = content.replaceAll(from, to);
  fs.writeFileSync(file, content);
}

console.log(JSON.stringify({ updated: files.map(file => path.relative(process.cwd(), file).replaceAll("\\", "/")) }, null, 2));
