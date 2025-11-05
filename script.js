const items = document.querySelectorAll('.item');
const modelArea = document.getElementById('modelArea');
const resetBtn = document.getElementById('resetBtn');

// Z-index layering rules
const zIndexMap = {
  shoe: 1,
  bottom: 2,
  top: 3,
  outerlayer: 4,
  accessory: 5,
};

// 🖥️ DESKTOP — Drag & drop
items.forEach(item => {
  item.addEventListener('dragstart', dragStart);
});
modelArea.addEventListener('dragover', dragOver);
modelArea.addEventListener('drop', drop);

function dragStart(e) {
  e.dataTransfer.setData('src', e.target.src);
  e.dataTransfer.setData('layer', e.target.dataset.layer);
}
function dragOver(e) {
  e.preventDefault();
}
function drop(e) {
  e.preventDefault();
  const src = e.dataTransfer.getData('src');
  const layer = e.dataTransfer.getData('layer');
  applyClothing(src, layer);
}

// 📱 MOBILE — Tap to apply clothing
if ('ontouchstart' in window) {
  items.forEach(item => {
    item.addEventListener('click', () => {
      applyClothing(item.src, item.dataset.layer);
    });
  });
}

// 🧥 Apply clothing (shared logic)
function applyClothing(src, layer) {
  const existing = modelArea.querySelector(`.clothing-layer[data-layer="${layer}"]`);
  if (existing) existing.remove();

  const clothing = document.createElement('img');
  clothing.src = src;
  clothing.classList.add('clothing-layer');
  clothing.dataset.layer = layer;
  clothing.style.zIndex = zIndexMap[layer] || 2;
  clothing.style.position = 'absolute';
  clothing.style.left = '50%';
  clothing.style.top = '50%';
  clothing.style.transform = 'translate(-50%, -50%)';
  clothing.style.width = '60%';
  clothing.style.pointerEvents = 'none';
  modelArea.appendChild(clothing);
}

// 🔄 Reset button
resetBtn.addEventListener('click', () => {
  document.querySelectorAll('.clothing-layer').forEach(c => c.remove());
});
