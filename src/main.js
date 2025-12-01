import * as THREE from "three";
import {
  CSS3DRenderer,
  CSS3DObject,
} from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";
import Papa from "papaparse";

// ==== CONFIG: UPDATE THESE TWO VALUES ====
const GOOGLE_CLIENT_ID =
  "1048504205080-d8po85dsl082q7qlu582df95i4bb79ed.apps.googleusercontent.com";

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQl5-NGDFKfTCVYpregBVsme57tLPq7HsCnRvwgmez2PpH5B4W3O8AirjrHooMZNvzEmqM9eDU4o9Pv/pub?output=csv";
// =========================================

let camera, scene, renderer, controls;
const objects = [];
const targets = {
  table: [],
  sphere: [],
  helix: [],
  grid: [],
};

// simple internal transition list (no external tween lib)
const transitions = [];

// =============== DATA LOADING ===============
async function loadPeopleFromSheet() {
  try {
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
    }

    const csvText = await res.text();
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data || [];

    const people = rows
      .map((row) => {
        const get = (...keys) => {
          for (const key of keys) {
            if (row[key] !== undefined && row[key] !== null) {
              const v = String(row[key]).trim();
              if (v.length) return v;
            }
          }
          return "";
        };

        const name = get("Name", "name", "Full Name");
        const country = get("Country", "country");
        const age = get("Age", "age");
        const interest = get("Interest", "interest");
        // in the provided CSV the header is " Net Worth " (with spaces)
        const netWorth = get(
          " Net Worth ",
          "Net Worth",
          "Net worth",
          "netWorth",
          "networth"
        );
        const photo = get("Photo", "photo", "Image");

        if (!name) return null;

        return { name, country, age, interest, netWorth, photo };
      })
      .filter(Boolean);

    console.log(`Loaded ${people.length} people from sheet`);
    return people;
  } catch (err) {
    console.error("Error loading Google Sheet CSV:", err);
    return [];
  }
}

// =============== NET WORTH → COLOUR ===============
function getNetWorthColor(valueStr) {
  if (!valueStr || typeof valueStr !== "string") {
    return "#111827";
  }
  const numericStr = valueStr.replace(/[^0-9.-]+/g, "");
  const value = parseFloat(numericStr);
  if (!isFinite(value)) {
    return "#111827";
  }

  // accent (border / glow) colours
  if (value < 100000) return "#EF3D22"; // Red
  if (value > 200000) return "#3A9F4B"; // Green
  return "#FDCA35"; // Orange 100k–200k
}

// darker, transparent fills for the inside of the card
function getFillColorFromAccent(accent) {
  switch (accent) {
    case "#EF3D22": // red
      return "rgba(59, 15, 11, 0.75)"; // dark maroon with transparency
    case "#FDCA35": // orange / yellow
      return "rgba(59, 47, 6, 0.75)"; // dark olive with transparency
    case "#3A9F4B": // green
      return "rgba(5, 46, 22, 0.75)"; // dark forest green with transparency
    default:
      return "rgba(2, 6, 23, 0.75)"; // fallback dark with transparency
  }
}

// =============== CARD CREATION ===============
function createTiles(people) {
  people.forEach((person, index) => {
    const element = document.createElement("div");
    element.className = "element";

    const accent = getNetWorthColor(person.netWorth);
    const fill = getFillColorFromAccent(accent);
    element.style.setProperty("--accent-color", accent);
    element.style.setProperty("--fill-color", fill);
    // Also set background directly for better browser support
    element.style.backgroundColor = fill;

    // Header: Country (left), Age (right)
    const header = document.createElement("div");
    header.className = "element-header";

    const countryEl = document.createElement("div");
    countryEl.className = "element-country";
    countryEl.textContent = (person.country || "")
      .toString()
      .slice(0, 2)
      .toUpperCase();

    const ageEl = document.createElement("div");
    ageEl.className = "element-age";
    ageEl.textContent = person.age ? String(person.age) : "";

    header.append(countryEl, ageEl);

    // Photo (square)
    const photoEl = document.createElement("div");
    photoEl.className = "element-photo";
    if (person.photo) {
      photoEl.style.backgroundImage = `url(${person.photo})`;
    } else {
      const hue = (index * 137.5) % 360;
      photoEl.style.backgroundImage = `linear-gradient(135deg, hsl(${hue},70%,60%), hsl(${hue},70%,45%))`;
    }

    // Footer: Name + Interest
    const footer = document.createElement("div");
    footer.className = "element-footer";

    const nameEl = document.createElement("div");
    nameEl.className = "element-name";
    nameEl.textContent = person.name;

    const interestEl = document.createElement("div");
    interestEl.className = "element-interest";
    interestEl.textContent = person.interest || "";

    footer.append(nameEl, interestEl);

    element.append(header, photoEl, footer);

    const objectCSS = new CSS3DObject(element);
    objectCSS.position.x = Math.random() * 4000 - 2000;
    objectCSS.position.y = Math.random() * 4000 - 2000;
    objectCSS.position.z = Math.random() * 4000 - 2000;

    // Ensure element doesn't get culled by browser
    element.style.backfaceVisibility = "visible";
    element.style.webkitBackfaceVisibility = "visible";
    element.style.willChange = "transform";
    element.style.visibility = "visible";
    element.style.opacity = "1";
    element.style.transformStyle = "preserve-3d";
    element.style.webkitTransformStyle = "preserve-3d";

    scene.add(objectCSS);
    objects.push(objectCSS);
  });
}

// =============== TARGET LAYOUTS ===============
function createTargetsTable(count) {
  targets.table.length = 0;

  const cols = 20;
  const rows = 10;
  const colSpacing = 220; // Increased spacing to prevent name overlay
  const rowSpacing = 280; // Increased spacing to prevent name overlay

  const totalWidth = (cols - 1) * colSpacing;
  const totalHeight = (rows - 1) * rowSpacing;

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const object = new THREE.Object3D();
    object.position.x = col * colSpacing - totalWidth / 2;
    object.position.y = totalHeight / 2 - row * rowSpacing;
    object.position.z = 50; // Lift cards up to prevent overlay

    targets.table.push(object);
  }
}

function createTargetsSphere(count) {
  targets.sphere.length = 0;
  const radius = 1400; // big enough so cards don't overlap too much
  const center = new THREE.Vector3(0, 0, 0);

  for (let i = 0; i < count; i++) {
    // Fibonacci sphere distribution - cards arranged from north pole to south pole
    const y = 1 - (i / (count - 1)) * 2; // from 1 (north) to -1 (south)
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = Math.PI * (3 - Math.sqrt(5)) * i;

    const object = new THREE.Object3D();
    object.position.x = radius * Math.cos(theta) * radiusAtY;
    object.position.y = radius * y;
    object.position.z = radius * Math.sin(theta) * radiusAtY;

    // Cards face outward from the sphere center (like Earth)
    // Each card looks away from the center, creating radial orientation
    object.lookAt(center);
    // Rotate 180 degrees so cards face outward (not inward)
    object.rotateY(Math.PI);
    targets.sphere.push(object);
  }
}

function createTargetsHelix(count) {
  targets.helix.length = 0;

  const radius = 1400; // Increased radius for more space
  const turns = 4; // Number of turns for the helix
  const perStrand = Math.ceil(count / 2);
  const height = 2000; // Increased height for more vertical spacing
  const stepY = height / Math.max(1, perStrand - 1);
  const centerY = new THREE.Vector3(0, 0, 0);

  for (let i = 0; i < count; i++) {
    const strand = i % 2; // 0 or 1 → double helix
    const n = Math.floor(i / 2); // index along each strand
    const t = perStrand > 1 ? n / (perStrand - 1) : 0;
    const angle = t * turns * Math.PI * 2;
    const phase = strand === 0 ? 0 : Math.PI; // opposite side for double helix
    const y = height / 2 - n * stepY;

    const object = new THREE.Object3D();
    object.position.x = radius * Math.cos(angle + phase);
    object.position.z = radius * Math.sin(angle + phase);
    object.position.y = y;

    // Cards face toward the center axis (y-axis) for helix
    centerY.y = y;
    object.lookAt(centerY);
    // Rotate 180 degrees so cards face outward
    object.rotateY(Math.PI);
    targets.helix.push(object);
  }
}

function createTargetsGrid(count) {
  targets.grid.length = 0;

  const xCount = 5;
  const yCount = 4;
  const zCount = 10;
  const xSpacing = 420;
  const ySpacing = 420;
  const zSpacing = 420;

  const offsetX = ((xCount - 1) * xSpacing) / 2;
  const offsetY = ((yCount - 1) * ySpacing) / 2;
  const offsetZ = ((zCount - 1) * zSpacing) / 2;

  for (let i = 0; i < count; i++) {
    // Calculate 3D grid indices: 5 columns (x), 4 rows (y), 10 layers (z)
    const xIndex = i % xCount;
    const yIndex = Math.floor((i % (xCount * yCount)) / xCount);
    const zIndex = Math.floor(i / (xCount * yCount));

    // Only create targets if within grid bounds
    if (zIndex >= zCount) break;

    const object = new THREE.Object3D();
    object.position.x = xIndex * xSpacing - offsetX;
    object.position.y = offsetY - yIndex * ySpacing;
    object.position.z = zIndex * zSpacing - offsetZ;

    targets.grid.push(object);
  }
}

// =============== CUSTOM TRANSFORMS (NO TWEEN LIB) ===============
function transform(targetArray, duration) {
  transitions.length = 0;
  const now = performance.now();

  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];
    const target = targetArray[i];
    if (!target) continue;

    transitions.push({
      object,
      fromPos: object.position.clone(),
      toPos: target.position.clone(),
      fromRot: object.rotation.clone(),
      toRot: target.rotation.clone(),
      start: now,
      duration,
    });
  }
}

function updateTransitions(now) {
  for (let i = transitions.length - 1; i >= 0; i--) {
    const t = transitions[i];
    const elapsed = now - t.start;
    let k = elapsed / t.duration;
    if (k >= 1) k = 1;
    if (k <= 0) k = 0;

    // Exponential ease-in-out (similar feel to original demo)
    let eased;
    if (k === 0 || k === 1) {
      eased = k;
    } else if (k < 0.5) {
      eased = 0.5 * Math.pow(2, 20 * k - 10);
    } else {
      eased = 1 - 0.5 * Math.pow(2, -20 * k + 10);
    }

    t.object.position.lerpVectors(t.fromPos, t.toPos, eased);
    t.object.rotation.x =
      t.fromRot.x + (t.toRot.x - t.fromRot.x) * eased;
    t.object.rotation.y =
      t.fromRot.y + (t.toRot.y - t.fromRot.y) * eased;
    t.object.rotation.z =
      t.fromRot.z + (t.toRot.z - t.fromRot.z) * eased;

    if (elapsed >= t.duration) {
      transitions.splice(i, 1);
    }
  }
}

// =============== RENDER LOOP ===============
function animate(now) {
  requestAnimationFrame(animate);
  updateTransitions(now || performance.now());
  if (controls) controls.update();
  render();
}

function render() {
  if (renderer && camera && scene) {
    renderer.render(scene, camera);
    
    // Force all card elements to remain visible (prevent browser culling)
    objects.forEach((obj) => {
      if (obj.element) {
        const element = obj.element;
        // Ensure element is always visible regardless of transform
        element.style.visibility = "visible";
        element.style.opacity = "1";
        element.style.display = "flex";
        element.style.backfaceVisibility = "visible";
        element.style.webkitBackfaceVisibility = "visible";
      }
    });
  }
}

// =============== SCENE + BUTTONS ===============
function wireButtons() {
  const btnTable = document.getElementById("btn-table");
  const btnSphere = document.getElementById("btn-sphere");
  const btnHelix = document.getElementById("btn-helix");
  const btnGrid = document.getElementById("btn-grid");

  const buttons = [btnTable, btnSphere, btnHelix, btnGrid];

  const setActiveButton = (active) => {
    buttons.forEach((btn) => {
      if (!btn) return;
      btn.classList.toggle("active", btn === active);
    });
  };

  btnTable?.addEventListener("click", () => {
    console.log("TABLE clicked");
    transform(targets.table, 900);
    setActiveButton(btnTable);
  });
  btnSphere?.addEventListener("click", () => {
    console.log("SPHERE clicked");
    transform(targets.sphere, 1100);
    setActiveButton(btnSphere);
  });
  btnHelix?.addEventListener("click", () => {
    console.log("HELIX clicked");
    transform(targets.helix, 1100);
    setActiveButton(btnHelix);
  });
  btnGrid?.addEventListener("click", () => {
    console.log("GRID clicked");
    transform(targets.grid, 1100);
    setActiveButton(btnGrid);
  });

  setActiveButton(btnTable);
}

function setupScene() {
  const container = document.getElementById("container");
  if (!container) {
    console.error("No #container element found");
    return;
  }

  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1, // Reduced near plane for better close-up rendering
    20000 // Increased far plane to prevent distant objects from being clipped
  );
  camera.position.z = 3200;

  scene = new THREE.Scene();

  renderer = new CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.top = "0";
  renderer.domElement.style.left = "0";
  renderer.domElement.style.pointerEvents = "none";
  // Prevent clipping and culling issues
  renderer.domElement.style.overflow = "visible";
  renderer.domElement.style.clip = "none";
  renderer.domElement.style.clipPath = "none";
  renderer.domElement.style.willChange = "transform";
  renderer.domElement.style.backfaceVisibility = "visible";
  renderer.domElement.style.webkitBackfaceVisibility = "visible";
  container.appendChild(renderer.domElement);

  controls = new TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 1.1;
  controls.zoomSpeed = 1.0;
  controls.panSpeed = 0.8;
  controls.minDistance = 900;
  controls.maxDistance = 7000;
  controls.addEventListener("change", render);

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
  }

  window.addEventListener("resize", onWindowResize);

  wireButtons();
}

// =============== GOOGLE LOGIN ===============
function initGoogleLogin() {
  if (typeof google === "undefined" || !google.accounts || !google.accounts.id) {
    setTimeout(initGoogleLogin, 100);
    return;
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredential,
  });

  google.accounts.id.renderButton(document.getElementById("g_id_signin"), {
    theme: "outline",
    size: "large",
    width: 260,
  });
}

function handleGoogleCredential(response) {
  try {
    const payload = JSON.parse(atob(response.credential.split(".")[1]));
    console.log("Logged in as:", payload.name || payload.email);
  } catch {
    console.log("Login successful");
  }

  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app-screen").style.display = "block";

  bootstrapApp();
}

async function bootstrapApp() {
  setupScene();
  const people = await loadPeopleFromSheet();

  createTiles(people);
  createTargetsTable(people.length);
  createTargetsSphere(people.length);
  createTargetsHelix(people.length);
  createTargetsGrid(people.length);

  transform(targets.table, 1000);
  animate(performance.now());
  render();
}

// boot
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGoogleLogin);
} else {
  initGoogleLogin();
}
