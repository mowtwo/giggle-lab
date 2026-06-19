(function () {
  const TITLE_IMAGE = "resources/loading/title.png";
  const STAGE_BG = "#17110d";

  function fitNode(node, baseWidth, baseHeight) {
    const scale = Math.min(Laya.stage.width / baseWidth, Laya.stage.height / baseHeight);
    node.scale(scale, scale);
    node.pos(
      (Laya.stage.width - baseWidth * scale) / 2,
      (Laya.stage.height - baseHeight * scale) / 2,
    );
  }

  function makeText(text, size, color) {
    const label = new Laya.Text();
    label.text = text;
    label.font = "Arial";
    label.fontSize = size;
    label.color = color;
    label.align = "center";
    label.valign = "middle";
    label.width = 640;
    label.height = size + 18;
    label.x = 55;
    return label;
  }

  function drawShell() {
    const root = new Laya.Sprite();
    const baseWidth = 750;
    const baseHeight = 1334;
    Laya.stage.addChild(root);

    const bg = new Laya.Sprite();
    bg.graphics.drawRect(0, 0, baseWidth, baseHeight, STAGE_BG);
    root.addChild(bg);

    const title = new Laya.Sprite();
    title.graphics.loadImage(TITLE_IMAGE, 0, 0, 520, 180);
    title.pos((baseWidth - 520) / 2, 200);
    root.addChild(title);

    const name = makeText("阿斗", 72, "#f6dfad");
    name.y = 470;
    root.addChild(name);

    const status = makeText("Laya 重构工程已接入", 30, "#d6b982");
    status.y = 570;
    root.addChild(status);

    const note = makeText("核心玩法迁移中", 24, "#a78f68");
    note.y = 630;
    root.addChild(note);

    const resize = () => fitNode(root, baseWidth, baseHeight);
    resize();
    Laya.stage.on(Laya.Event.RESIZE, null, resize);
  }

  window.$_main_ = async function () {
    Laya.stage.bgColor = STAGE_BG;

    try {
      await Laya.loader.load(TITLE_IMAGE);
    } catch (error) {
      console.warn("Original title image was not loaded.", error);
    }

    drawShell();
  };
})();
