// 输入管理器
class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.mouseX = 0;
    this.mouseY = 0;
    this.clickHandlers = [];
    this._setupListeners();
  }

  _setupListeners() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouseX = (e.clientX - rect.left) * scaleX;
      this.mouseY = (e.clientY - rect.top) * scaleY;
      this._fireClick();
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouseX = (e.clientX - rect.left) * scaleX;
      this.mouseY = (e.clientY - rect.top) * scaleY;
      this._fireHover();
    });

    // 触摸支持
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const touch = e.touches[0];
      this.mouseX = (touch.clientX - rect.left) * scaleX;
      this.mouseY = (touch.clientY - rect.top) * scaleY;
      this._fireClick();
    });
  }

  onClick(handler) {
    this.clickHandlers.push(handler);
  }

  _fireClick() {
    this.clickHandlers.forEach(h => h(this.mouseX, this.mouseY));
  }

  _fireHover() {
    // 预留 hover 处理
  }

  isInside(x, y, w, h) {
    return this.mouseX >= x && this.mouseX <= x + w &&
           this.mouseY >= y && this.mouseY <= y + h;
  }
}
