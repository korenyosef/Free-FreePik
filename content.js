console.log("[Free FreePik] Hijacker Active.");

function parseSrcset(srcset, baseUri) {
  if (!srcset) return [];
  return srcset
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split(/\s+/);
      const url = parts[0];
      const descriptor = parts[1] || "original";
      try {
        return { url: new URL(url, baseUri).href, descriptor: descriptor };
      } catch (e) {
        return null;
      }
    })
    .filter((item) => item !== null);
}

function showMenu(button, variants) {
  let host = document.getElementById("fp-hd-menu-host");
  if (host) host.remove();

  host = document.createElement("div");
  host.id = "fp-hd-menu-host";
  host.style.position = "fixed";
  host.style.zIndex = "2147483647";
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });

  const rect = button.getBoundingClientRect();
  const menuWidth = 300;
  const screenWidth = window.innerWidth;

  let leftPos = rect.left;
  if (leftPos + menuWidth > screenWidth) {
    leftPos = rect.right - menuWidth;
  }

  leftPos = Math.max(10, leftPos);

  const style = document.createElement("style");
  style.textContent = `
    .menu {
      position: fixed;
      top: ${rect.bottom + 12}px;
      left: ${leftPos}px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.3);
      width: 300px; /* Increased width for stability */
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      border: 1px solid rgba(0,0,0,0.05);
      font-family: 'Inter', -apple-system, system-ui, sans-serif;
      z-index: 2147483647;
    }
    .item {
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      padding: 12px 16px;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: flex-start; /* Group items to the left */
      gap: 12px; /* Guaranteed gap between elements */
      color: #1e293b;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: auto !important;
      user-select: none;
      white-space: nowrap;
    }
    .label-group {
      display: flex;
      align-items: center;
      flex-grow: 1; /* Pushes the tag to the right */
      min-width: 0;
    }
    .item:hover {
      background: #eff6ff;
      color: #1d4ed8;
      border-color: #dbeafe;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(30, 58, 138, 0.05);
    }
    .tag { 
      font-size: 11px; 
      background: #e2e8f0; 
      color: #475569;
      padding: 4px 10px; 
      border-radius: 20px;
      font-weight: 700;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      min-width: 75px;
      text-align: center;
      flex-shrink: 0; /* Prevents pill from being crushed */
    }
    .item:hover .tag { 
      background: #1d4ed8; 
      color: white; 
    }
    .watermark-note {
      color: #ef4444;
      font-size: 10px;
      font-weight: 800;
      margin-left: 6px;
      background: #fee2e2;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #fecaca;
    }
  `;
  shadow.appendChild(style);

  const menu = document.createElement("div");
  menu.className = "menu";

  variants.forEach((v) => {
    const btn = document.createElement("button");
    btn.className = "item";

    let sizeLabel = v.descriptor;
    let qualityName = "Download";
    let isWatermarked = false;

    if (v.descriptor.endsWith("w")) {
      const num = parseInt(v.descriptor.replace("w", ""));
      sizeLabel = `${num}px`;

      if (num <= 400) qualityName = "Small View";
      else if (num <= 800) qualityName = "Regular";
      else if (num <= 1200) qualityName = "High-Res";
      else if (num <= 1600) qualityName = "Full HD";
      else qualityName = "Ultra HD";

      if (["1060", "1480", "2000"].includes(num.toString())) {
        isWatermarked = true;
      }
    }

    btn.innerHTML = `
      <div class="label-group">
        ${qualityName}
        ${isWatermarked ? '<span class="watermark-note">Watermark</span>' : ""}
      </div> 
      <span class="tag">${sizeLabel}</span>
    `;

    btn.onmousedown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("[Free FreePik] Downloading:", v.url);
      chrome.runtime.sendMessage({
        action: "download",
        url: v.url,
        filename: `freepik_hd_${v.descriptor}_${Date.now()}.jpg`,
      });
      host.remove();
    };

    menu.appendChild(btn);
  });

  shadow.appendChild(menu);

  const closer = (e) => {
    const path = e.composedPath();
    if (!path.includes(host) && !path.includes(button)) {
      host.remove();
      document.removeEventListener("mousedown", closer, true);
    }
  };
  setTimeout(() => {
    document.addEventListener("mousedown", closer, true);
  }, 10);
}

function hijackButton() {
  const premiumBtn = document.querySelector(
    'button[data-cy="go-premium-download"]',
  );

  if (premiumBtn && !premiumBtn.dataset.hijacked) {
    premiumBtn.dataset.hijacked = "true";

    const textSpan = premiumBtn.querySelector("span");
    if (textSpan) textSpan.innerText = "Download";
    premiumBtn.style.background = "#1273eb";
    premiumBtn.style.color = "white";
    premiumBtn.style.border = "none";

    premiumBtn.addEventListener(
      "mousedown",
      (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const mainImg = document.querySelector("img[srcset], img[data-srcset]");
        if (mainImg) {
          const srcset =
            mainImg.getAttribute("srcset") ||
            mainImg.getAttribute("data-srcset");
          const variants = parseSrcset(srcset, document.baseURI);
          if (variants.length > 0) {
            showMenu(premiumBtn, variants);
          } else {
            console.error("No srcset variants found.");
          }
        }
      },
      true,
    );

    premiumBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
  }
}

const observer = new MutationObserver(() => hijackButton());
observer.observe(document.body, { childList: true, subtree: true });
hijackButton();
