// public/js/dashboard.js

let currentPage = 1;
let totalPages = 1;
let scene, camera, renderer, labelRenderer, controls;
let planets = [];
let labelObjects = [];
let raycaster, mouse;
let animationId;

// === Онбординг ===
function showOnboarding() { /* ... как было */ }
function closeOnboarding() { /* ... как было */ }
function showToast(message, type) { /* ... как было */ }

// === Загрузка комнат для списка ===
async function loadRooms(page = 1) {
  try {
    const res = await fetch(`/rooms/my?page=${page}&limit=3`);
    if (!res.ok) throw new Error('Ошибка загрузки комнат');
    const data = await res.json();
    let rooms = [];
    if (data && typeof data === 'object') {
      if (Array.isArray(data)) rooms = data;
      else if (Array.isArray(data.items)) {
        rooms = data.items;
        totalPages = data.totalPages || 1;
        currentPage = data.page || 1;
      }
    }
    if (!Array.isArray(rooms)) rooms = [];

    const container = document.getElementById('rooms-list');
    const paginationContainer = document.getElementById('pagination-container');
    container.innerHTML = '';
    if (rooms.length === 0) {
      container.innerHTML = `<p class="text-center text-gray-500 text-sm py-4">
        <i class="fas fa-inbox text-xl mb-2 opacity-60"></i><br>Пока нет комнат</p>`;
      paginationContainer.innerHTML = '';
      return;
    }
    rooms.forEach(room => {
      const isOwner = room.is_owner;
      const roleText = isOwner ? 'Владелец' : 'Участник';
      const roleClass = isOwner ? 'room-role' : 'room-role bg-blue-600';
      const el = document.createElement('a');
      el.href = `/room/${room.id}`;
      el.className = 'room-card';
      el.innerHTML = `
        <h3 class="room-name">${room.name}</h3>
        <p class="room-desc">${room.description || 'Без описания'}</p>
        <p class="room-code">Код: <strong>${room.invite_code}</strong></p>
        <span class="${roleClass}">${roleText}</span>
      `;
      container.appendChild(el);
    });
    renderPagination(currentPage, totalPages, paginationContainer);
  } catch (err) {
    console.error(err);
    document.getElementById('rooms-list').innerHTML = '<p class="text-red-500">Ошибка загрузки комнат</p>';
  }
}

// === Загрузка ВСЕХ комнат для 3D ===
async function loadAllRoomsFor3D() {
  try {
    const res = await fetch(`/rooms/my?limit=999`);
    if (!res.ok) throw new Error('Ошибка загрузки комнат для 3D');
    const data = await res.json();
    let rooms = [];
    if (Array.isArray(data)) rooms = data;
    else if (Array.isArray(data.items)) rooms = data.items;
    init3DScene(rooms);
  } catch (err) {
    console.error('Ошибка загрузки для 3D:', err);
    init3DScene([]);
  }
}

// === Пагинация ===
function renderPagination(currentPage, totalPages, container) {
  if (!container) return;
  if (totalPages <= 1) { container.innerHTML = ''; return; }
  let html = '<div class="flex gap-1 justify-center mt-4 flex-wrap">';
  if (currentPage > 1) html += `<button onclick="goToPage(${currentPage - 1})" class="pagination-btn">‹</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) html += `<span class="pagination-btn active">${i}</span>`;
    else html += `<button onclick="goToPage(${i})" class="pagination-btn">${i}</button>`;
  }
  if (currentPage < totalPages) html += `<button onclick="goToPage(${currentPage + 1})" class="pagination-btn">›</button>`;
  html += '</div>';
  container.innerHTML = html;
}

function goToPage(page) {
  if (page === currentPage) return;
  loadRooms(page);
}

// === 3D СЦЕНА с планетами и подписями ===
function init3DScene(rooms) {
  const container = document.getElementById('three-container');
  if (!container) return;
  
  // Очистка
  if (animationId) cancelAnimationFrame(animationId);
  if (renderer) {
    renderer.domElement.remove();
    renderer = null;
  }
  if (labelRenderer) {
    labelRenderer.domElement.remove();
    labelRenderer = null;
  }
  if (scene) {
    scene = null;
  }
  planets = [];
  labelObjects = [];

  container.style.width = '100%';
  container.style.height = '420px';
  container.style.position = 'relative';
  container.style.background = 'radial-gradient(circle at 30% 40%, #0f0a1e, #050510)';
  container.style.borderRadius = '20px';
  container.style.overflow = 'hidden';
  container.style.marginBottom = '30px';
  container.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';

  // Сцена
  scene = new THREE.Scene();
  scene.background = null;

  const width = container.clientWidth || 800;
  const height = container.clientHeight || 420;

  // Камера
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 2, 7);
  camera.lookAt(0, 0, 0);

  // WebGL рендерер
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // CSS2D рендерер для подписей
  labelRenderer = new THREE.CSS2DRenderer();
  labelRenderer.setSize(width, height);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.left = '0';
  labelRenderer.domElement.style.pointerEvents = 'none'; // чтобы подписи не мешали управлению
  container.appendChild(labelRenderer.domElement);

  // Орбит-контролы
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.target.set(0, 0, 0);

  // Raycaster
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Свет
  const ambient = new THREE.AmbientLight(0x404060);
  scene.add(ambient);
  const light1 = new THREE.PointLight(0x8b5cf6, 1.5, 20);
  light1.position.set(2, 3, 4);
  scene.add(light1);
  const light2 = new THREE.PointLight(0x3b82f6, 1, 20);
  light2.position.set(-3, -1, 5);
  scene.add(light2);
  const backLight = new THREE.PointLight(0x1a0a3e, 0.5);
  backLight.position.set(0, -2, -5);
  scene.add(backLight);

  createStarField();

  // Создаём планеты
  if (!rooms || rooms.length === 0) {
    rooms = Array.from({ length: 15 }, (_, i) => ({
      id: i+1,
      name: `Комната ${i+1}`,
      is_owner: Math.random() > 0.5,
      vote_count: Math.floor(Math.random() * 20) + 1
    }));
  }

  createPlanets(rooms);

  // События мыши
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('mouseleave', onMouseLeave);

  // Запуск анимации
  animate();

  // Ресайз
  window.addEventListener('resize', onResize);
}

function createStarField() {
  const starsGeo = new THREE.BufferGeometry();
  const starsCount = 1500;
  const positions = new Float32Array(starsCount * 3);
  for (let i = 0; i < starsCount * 3; i += 3) {
    const radius = 10 + Math.random() * 15;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    positions[i] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i+1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i+2] = radius * Math.cos(phi);
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starsMat = new THREE.PointsMaterial({
    color: 0x8b9cf6,
    size: 0.08,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
  });
  const stars = new THREE.Points(starsGeo, starsMat);
  scene.add(stars);
}

// Создаём текстуру свечения через Canvas
function createGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(200,200,255,0.8)');
  gradient.addColorStop(0.5, 'rgba(100,100,255,0.3)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createPlanets(rooms) {
  const glowTexture = createGlowTexture();
  const count = rooms.length;
  const radius = 2.8;

  rooms.forEach((room, i) => {
    // Равномерное распределение по сфере (золотое сечение)
    const phi = Math.acos(1 - 2 * (i + 0.5) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    // Размер планеты зависит от количества голосований
    const voteCount = room.vote_count || 0;
    const baseSize = 0.25 + (voteCount / 20) * 0.45;
    const size = Math.min(baseSize, 0.7);

    // Цвет: владелец – фиолетовый, участник – синий
    const color = room.is_owner ? new THREE.Color(0x8b5cf6) : new THREE.Color(0x3b82f6);

    // Создаём сферу с текстурой свечения
    const geometry = new THREE.SphereGeometry(size * 0.8, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.9,
    });
    const planet = new THREE.Mesh(geometry, material);
    planet.position.set(x, y, z);
    planet.userData = { roomId: room.id, name: room.name, isOwner: room.is_owner };
    scene.add(planet);
    planets.push(planet);

    // Добавляем свечение (спрайт)
    const spriteMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: color,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(size * 2.5, size * 2.5, 1);
    sprite.position.copy(planet.position);
    scene.add(sprite);

    // Подпись (CSS2DObject) — показывается при наведении
    const labelDiv = document.createElement('div');
    labelDiv.textContent = room.name;
    labelDiv.style.color = '#c4b5fd';
    labelDiv.style.fontSize = '12px';
    labelDiv.style.fontWeight = 'bold';
    labelDiv.style.textShadow = '0 0 10px rgba(139,92,246,0.8)';
    labelDiv.style.background = 'rgba(15,15,30,0.6)';
    labelDiv.style.padding = '2px 8px';
    labelDiv.style.borderRadius = '10px';
    labelDiv.style.border = '1px solid rgba(139,92,246,0.3)';
    labelDiv.style.backdropFilter = 'blur(4px)';
    labelDiv.style.pointerEvents = 'none';
    labelDiv.style.display = 'none'; // скрыто по умолчанию

    const label = new THREE.CSS2DObject(labelDiv);
    label.position.set(x, y + size + 0.25, z);
    scene.add(label);
    labelObjects.push(label);

    // Соединительные линии
    if (i > 0) {
      // можно добавить линии между ближайшими, но для упрощения оставим как есть
    }
  });

  // Добавляем соединительные линии между близкими планетами
  if (count > 1) {
    const linePositions = [];
    for (let i = 0; i < count; i++) {
      for (let j = i+1; j < count; j++) {
        const p1 = planets[i].position;
        const p2 = planets[j].position;
        const dist = p1.distanceTo(p2);
        if (dist < 4) {
          linePositions.push(p1.x, p1.y, p1.z);
          linePositions.push(p2.x, p2.y, p2.z);
        }
      }
    }
    if (linePositions.length > 0) {
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x4f46e5,
        transparent: true,
        opacity: 0.15,
      });
      const lines = new THREE.LineSegments(lineGeo, lineMat);
      scene.add(lines);
    }
  }
}

// Обработчики мыши
function onMouseMove(event) {
  const container = document.getElementById('three-container');
  if (!container) return;
  const rect = container.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets);

  // Скрываем все подписи
  labelObjects.forEach(label => {
    label.element.style.display = 'none';
  });

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    // Ищем соответствующую подпись
    const idx = planets.indexOf(hit);
    if (idx !== -1 && labelObjects[idx]) {
      labelObjects[idx].element.style.display = 'block';
      renderer.domElement.style.cursor = 'pointer';
    }
  } else {
    renderer.domElement.style.cursor = 'default';
  }
}

function onMouseLeave() {
  labelObjects.forEach(label => {
    label.element.style.display = 'none';
  });
  renderer.domElement.style.cursor = 'default';
}

function onResize() {
  const container = document.getElementById('three-container');
  if (!container) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (camera) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  if (renderer) {
    renderer.setSize(width, height);
  }
  if (labelRenderer) {
    labelRenderer.setSize(width, height);
  }
}

// Анимация
function animate() {
  animationId = requestAnimationFrame(animate);
  if (controls) controls.update();

  // Вращение планет вокруг своей оси (опционально)
  planets.forEach((planet, i) => {
    planet.rotation.y += 0.005 * (i % 2 === 0 ? 1 : -1);
  });

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
  if (labelRenderer && scene && camera) {
    labelRenderer.render(scene, camera);
  }
}

// === Загрузка предложений (заглушка) ===
async function loadProposals() { /* ... */ }
async function approveProposal(id) { /* ... */ }
async function rejectProposal(id) { /* ... */ }
function openProposalsModal() { /* ... */ }
function closeProposalsModal() { /* ... */ }

// === Инициализация ===
document.addEventListener('DOMContentLoaded', () => {
  loadRooms(1);
  loadAllRoomsFor3D();
  fetchGlobalNotifications?.();
  setInterval(fetchGlobalNotifications, 10000);
  if (!localStorage.getItem('seenOnboarding')) {
    setTimeout(showOnboarding, 600);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeProposalsModal();
    document.getElementById('onboarding-overlay')?.classList.contains('active') && closeOnboarding();
  }
});

window.approveProposal = approveProposal;
window.rejectProposal = rejectProposal;
window.openProposalsModal = openProposalsModal;
window.closeProposalsModal = closeProposalsModal;
window.showToast = showToast;
window.goToPage = goToPage;