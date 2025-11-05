// script.js - Desktop drag/drop + touch support (stable)

// Helpers & DOM
const modelArea = document.getElementById('modelArea');
let items = Array.from(document.querySelectorAll('.item')); // array so we can re-query if needed

// Place clothing on model (centralized)
function placeClothingOnModel(src, layer) {
  if (!src || !layer) return;

  // remove existing same layer
  const existing = modelArea.querySelector(`.clothing-layer[data-layer="${layer}"]`);
  if (existing) existing.remove();

  // create new clothing element
  const clothing = document.createElement('img');
  clothing.src = src;
  clothing.classList.add('clothing-layer');
  clothing.dataset.layer = layer;

  const zIndexMap = {
    shoe: 1,
    bottom: 2,
    top: 3,
    outerlayer: 4,
    accessory: 5,
  };
  clothing.style.zIndex = (zIndexMap[layer] || 2);

  clothing.style.position = 'absolute';
  clothing.style.left = '50%';
  clothing.style.top = '50%';
  clothing.style.transform = 'translate(-50%, -50%)';
  clothing.style.width = '60%';
  clothing.style.pointerEvents = 'none';

  modelArea.appendChild(clothing);
}

// ------------------ Desktop drag & drop (native) ------------------
function enableDesktopDrag() {
  // re-query items in case DOM changed
  items = Array.from(document.querySelectorAll('.item'));

  items.forEach(item => {
    // only attach once
    if (!item._desktopBound) {
      item.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('src', item.src);
        e.dataTransfer.setData('layer', item.dataset.layer);
      });
      item._desktopBound = true;
    }
  });

  // model area drop handlers
  modelArea.addEventListener('dragover', function(e) { e.preventDefault(); });
  modelArea.addEventListener('drop', function(e) {
    e.preventDefault();
    const src = e.dataTransfer.getData('src');
    const layer = e.dataTransfer.getData('layer');
    placeClothingOnModel(src, layer);
  });
}

// ------------------ Touch drag support ------------------
let touchState = {
  active: false,
  dragging: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  sourceSrc: null,
  sourceLayer: null,
  sourceItem: null,
  floating: null,
  threshold: 12 // px to start drag (increase if accidental drags)
};

function createFloating(src, x, y) {
  const clone = document.createElement('img');
  clone.src = src;
  clone.className = 'touch-floating';
  clone.style.left = (x - 40) + 'px';
  clone.style.top = (y - 40) + 'px';
  clone.style.width = '80px';
  clone.style.height = 'auto';
  document.body.appendChild(clone);
  return clone;
}

function onTouchStart(e) {
  const t = e.touches ? e.touches[0] : null;
  if (!t) return;
  const el = e.target.closest('.item');
  if (!el) return;

  touchState.active = true;
  touchState.dragging = false;
  touchState.startX = t.clientX;
  touchState.startY = t.clientY;
  touchState.currentX = t.clientX;
  touchState.currentY = t.clientY;
  touchState.sourceSrc = el.src;
  touchState.sourceLayer = el.dataset.layer;
  touchState.sourceItem = el;
  // don't preventDefault here to allow scrolling; we decide on move
}

function onTouchMove(e) {
  if (!touchState.active) return;
  const t = e.touches ? e.touches[0] : null;
  if (!t) return;
  touchState.currentX = t.clientX;
  touchState.currentY = t.clientY;

  if (!touchState.dragging) {
    const dx = Math.abs(t.clientX - touchState.startX);
    const dy = Math.abs(t.clientY - touchState.startY);
    if (dx > touchState.threshold || dy > touchState.threshold) {
      // start dragging
      touchState.dragging = true;
      // create floating clone
      touchState.floating = createFloating(touchState.sourceSrc, touchState.currentX, touchState.currentY);
      // lock page scroll during drag
      document.body.style.touchAction = 'none';
      // prevent default to stop scrolling while dragging
      e.preventDefault();
    } else {
      return; // still within threshold; allow scroll
    }
  }

  // update floating clone position
  if (touchState.floating) {
    const fw = touchState.floating.width || 80;
    const fh = touchState.floating.height || (fw * 1.0);
    touchState.floating.style.left = (touchState.currentX - fw / 2) + 'px';
    touchState.floating.style.top = (touchState.currentY - fh / 2) + 'px';
  }
  e.preventDefault();
}

function onTouchEnd(e) {
  if (!touchState.active) return;
  if (touchState.dragging) {
    // determine drop
    const x = touchState.currentX;
    const y = touchState.currentY;
    const rect = modelArea.getBoundingClientRect();
    if (x > rect.left && x < rect.right && y > rect.top && y < rect.bottom) {
      // dropped on model
      placeClothingOnModel(touchState.sourceSrc, touchState.sourceLayer);
    }
    // cleanup floating clone
    if (touchState.floating) {
      touchState.floating.remove();
      touchState.floating = null;
    }
    document.body.style.touchAction = '';
  }
  // reset state
  touchState.active = false;
  touchState.dragging = false;
  touchState.startX = touchState.startY = touchState.currentX = touchState.currentY = 0;
  touchState.sourceSrc = null;
  touchState.sourceLayer = null;
  touchState.sourceItem = null;
}

// Attach touch handlers to items (delegation also possible)
function enableTouchDrag() {
  // re-query items
  items = Array.from(document.querySelectorAll('.item'));
  // remove previous handlers to avoid duplicates
  items.forEach(it => {
    // Use passive:true on touchstart so browsers can scroll; move uses passive:false
    it.addEventListener('touchstart', onTouchStart, {passive: true});
    it.addEventListener('touchmove', onTouchMove, {passive: false});
    it.addEventListener('touchend', onTouchEnd, {passive: true});
    it.addEventListener('touchcancel', onTouchEnd, {passive: true});
  });
}

// initialize both systems
function init() {
  enableDesktopDrag();
  enableTouchDrag();
}

// run init on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// expose placeClothingOnModel for debugging
window.placeClothingOnModel = placeClothingOnModel;

// Reset button (if present)
const resetBtn = document.getElementById('resetBtn');
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    document.querySelectorAll('.clothing-layer').forEach(c => c.remove());
  });
}

// Screenshot handler (if you have screenshot button)
const screenshotBtn = document.getElementById('screenshotBtn');
if (screenshotBtn) {
  screenshotBtn.addEventListener('click', () => {
    if (typeof html2canvas === 'undefined') {
      alert('Screenshot requires html2canvas library.');
      return;
    }
    html2canvas(document.getElementById('modelArea')).then(canvas => {
      const link = document.createElement('a');
      link.download = 'dressup.png';
      link.href = canvas.toDataURL();
      link.click();
    }).catch(err => {
      console.error(err);
      alert('Screenshot failed. Try serving the page via HTTP (not file://).');
    });
  });
}
