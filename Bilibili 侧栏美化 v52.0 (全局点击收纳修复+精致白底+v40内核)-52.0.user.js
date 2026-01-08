// ==UserScript==
// @name         Bilibili 侧栏美化 v52.0 (全局点击收纳修复+精致白底+v40内核)
// @namespace    http://tampermonkey.net/
// @version      52.0
// @description  利用全局点击监听彻底修复侧栏不收回问题；精致化投币弹窗（白底圆角阴影）；保留90%铺满与侧栏自动感应。
// @author       Gemini Thought Partner
// @match        https://www.bilibili.com/read/*
// @match        https://www.bilibili.com/cv/*
// @match        https://www.bilibili.com/opus/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  // ==========================================
  // 1. 图标库
  // ==========================================
  const ICONS = {
    full: '<svg viewBox="0 0 24 24"><path d="M15 3h6v6M14 10l6.1-6.1M9 21H3v-6M10 14l-6.1 6.1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    exitFull:
      '<svg viewBox="0 0 24 24"><path d="M4 14h6v6M10 14L3 21M20 10h-6V4M14 10l7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrowRight:
      '<svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-2.5 0V7a4.5 4.5 0 1 0-9 0v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close:
      '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></line><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></line></svg>',
  };

  // ==========================================
  // 2. CSS: 样式定义
  // ==========================================
  const customCss = `
        /* --- 0. 全局核打击 --- */
        html, body {
            overflow-x: hidden !important;
            width: 100% !important;
            max-width: none !important;
        }

        /* --- 1. 侧边栏容器 --- */
        .right-sidebar-wrap {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: fixed !important;
            right: 20px !important;
            bottom: 100px !important;
            top: auto !important; left: auto !important; margin: 0 !important;

            /* 侧栏守恒 */
            zoom: 1 !important;

            transform: none !important;
            width: 50px !important; height: auto !important;
            z-index: 2147483640 !important;
            pointer-events: none !important;
            transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.3s ease !important;
        }

        body.gm-immersive-mode .right-sidebar-wrap {
            zoom: 1.11111 !important;
        }

        /* 侧边栏本体 */
        .side-toolbar {
            pointer-events: auto !important;
            width: 46px !important;
            background: #fff !important;
            border: 1px solid #e3e5e7 !important;
            border-radius: 10px !important;
            box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
            padding: 8px 0 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 8px !important;
            height: auto !important; min-height: auto !important;
            position: relative !important; z-index: 2 !important;
        }
        .side-toolbar__box, .side-toolbar__bottom { display: contents !important; }

        /* --- 2. 按钮样式 --- */
        .side-toolbar__action, .side-toolbar__btn, #gm-immersive-btn {
            width: 36px !important; height: auto !important; min-height: 36px !important;
            margin: 0 !important; padding: 4px 0 !important;
            display: flex !important; flex-direction: column !important;
            justify-content: center !important; align-items: center !important;
            border-radius: 6px !important; cursor: pointer !important;
            background: transparent !important; color: #61666d !important;
            transition: all 0.2s !important; position: relative !important;
            font-size: 12px !important; line-height: 1.2 !important;
            border: none !important;
        }
        .side-toolbar__action:hover, .side-toolbar__btn:hover, #gm-immersive-btn:hover {
            background-color: #f1f2f3 !important; color: #00aeec !important;
        }
        .side-toolbar__action.is-active { color: #00aeec !important; }
        .side-toolbar__action svg, #gm-immersive-btn svg {
            width: 22px !important; height: 22px !important; margin-bottom: 2px !important;
        }
        .side-toolbar__btn.backtop span { display: flex !important; flex-direction: column !important; align-items: center !important; }
        .side-toolbar__box + .side-toolbar__bottom::before {
            content: ''; display: block; width: 20px; height: 1px; background: #f1f2f3; margin: 2px 0;
        }

        /* --- 3. 侧边感应与折叠 --- */
        #gm-collapse-btn {
            width: 36px !important; height: 24px !important; min-height: 24px !important;
            display: flex !important; align-items: center !important; justify-content: center !important;
            cursor: pointer !important; color: #ccc !important;
            margin-top: 4px !important; border-top: 1px solid #f6f6f6 !important;
        }
        #gm-collapse-btn:hover { color: #00aeec !important; background: transparent !important; }

        /* 感应条 */
        #gm-sidebar-trigger {
            position: fixed; top: 0; right: 0; bottom: 0; width: 25px;
            background: transparent; z-index: 2147483645;
            display: none;
        }

        /* 折叠状态 */
        .right-sidebar-wrap.gm-collapsed {
            transform: translateX(120%) !important;
            opacity: 0.5 !important;
        }
        /* 呼出状态 (hover 或 目录开启) */
        .right-sidebar-wrap.gm-hover-show,
        .right-sidebar-wrap.gm-catalog-open {
            transform: translateX(0) !important;
            opacity: 1 !important;
        }

        /* --- 4. 铺满模式居中与放大 --- */
        body.gm-immersive-mode { overflow-x: hidden !important; }

        body.gm-immersive-mode #app,
        body.gm-immersive-mode .opus-detail {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        body.gm-immersive-mode .article-holder,
        body.gm-immersive-mode .opus-module-content {
            width: auto !important;
            max-width: none !important;
            margin: 0 auto !important;
            padding-top: 20px !important;
            background-color: var(--bg1) !important;
        }

        body.gm-immersive-mode .right-side-bar,
        body.gm-immersive-mode .left-side-bar { display: none !important; }
        body.gm-immersive-mode .right-sidebar-wrap { display: block !important; }

        /* --- 5. 目录与弹窗修正 (白底+阴影) --- */
        .opus-collection:not([style*="display: none"]),
        .collection-m-popover:not([style*="display: none"]),
        .bili-popup, .coin-popup, .toast-wrap, .bili-toast {
            position: fixed !important;
            right: 80px !important;
            bottom: 40px !important;
            top: auto !important; left: auto !important; transform: none !important;

            background-color: #ffffff !important;
            border: 1px solid #e3e5e7 !important;
            border-radius: 12px !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;

            z-index: 2147483647 !important; pointer-events: auto !important;
            display: flex !important; flex-direction: column !important;
        }

        /* 投币窗口精致化 */
        .coin-popup {
            padding: 24px !important;
            width: 280px !important;
            text-align: center !important; color: #333 !important;
            box-sizing: border-box !important;
        }
        .coin-popup .title {
            font-size: 16px !important; font-weight: bold !important;
            text-align: center !important; margin: 0 0 20px 0 !important;
            display: block !important; line-height: 1.5 !important;
        }
        .coin-popup .close-btn-row { display: none !important; }
        .coin-popup .close-btn {
            position: absolute !important; top: 12px !important; right: 12px !important;
            width: 20px !important; height: 20px !important;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' fill='%23ccc'/%3E%3C/svg%3E") !important;
            background-size: cover !important; cursor: pointer !important;
        }

        .opus-collection__content { flex: 1 !important; min-height: 100px !important; overflow-y: auto !important; background: #fff !important; }

        #gm-catalog-close {
            position: absolute; top: 15px; right: 15px; width: 28px; height: 28px;
            border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center;
            color: #999; background: transparent; z-index: 20;
        }
        #gm-catalog-close:hover { background: #f1f2f3; color: #333; }

        /* 弹窗补偿 */
        body.gm-immersive-mode .bili-popup,
        body.gm-immersive-mode .coin-popup,
        body.gm-immersive-mode .toast-wrap,
        body.gm-immersive-mode .opus-collection:not([style*="display: none"]),
        body.gm-immersive-mode .collection-m-popover:not([style*="display: none"]) {
            zoom: 1.11111 !important;
        }

        /* --- 6. 美化消息提示 --- */
        #gm-custom-toast {
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            background: #ffffff !important; color: #505050 !important;
            border: 1px solid #e3e5e7 !important; border-radius: 8px !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
            padding: 12px 24px; font-size: 14px; font-weight: bold;
            z-index: 2147483647; opacity: 0; visibility: hidden; pointer-events: none;
            transition: all 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.28);
        }
        #gm-custom-toast.gm-show {
            opacity: 1; visibility: visible;
            transform: translate(-50%, -50%) scale(1);
        }
        .bili-toast, .link-toast, div[class*="toast"] { display: none !important; }
    `;

  if (typeof GM_addStyle !== "undefined") {
    GM_addStyle(customCss);
  } else {
    const style = document.createElement("style");
    style.innerHTML = customCss;
    document.head.appendChild(style);
  }

  // ==========================================
  // 3. JS: 逻辑控制
  // ==========================================

  let toastTimer = null;
  function showToast(msg) {
      let toast = document.getElementById('gm-custom-toast');
      if (!toast) {
          toast = document.createElement('div');
          toast.id = 'gm-custom-toast';
          document.body.appendChild(toast);
      }
      toast.innerText = msg;
      requestAnimationFrame(() => toast.classList.add('gm-show'));
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('gm-show'), 2000);
  }

  function moveSidebar() {
    const sidebar = document.querySelector(".right-sidebar-wrap");
    if (sidebar && sidebar.parentElement !== document.body) {
      document.body.appendChild(sidebar);
    }
  }

  function fixButtonText() {
    const btns = document.querySelectorAll(".side-toolbar__btn");
    btns.forEach((btn) => {
      const text = btn.innerText.trim();
      if (text.includes("旧版") && text !== "旧版") {
        if (btn.childNodes.length > 0) {
          for (let node of btn.childNodes) {
            if (node.nodeType === 3 && node.textContent.includes("旧版")) {
              node.textContent = "旧版";
            }
          }
        } else {
          btn.innerText = "旧版";
        }
      }
    });
  }

  function performSmartZoom() {
    const content =
      document.querySelector(".opus-module-content") ||
      document.querySelector(".article-holder") ||
      document.querySelector(".opus-detail");
    if (!content) return;

    const target = document.querySelector(".opus-detail") || content;

    target.style.zoom = "0.9";

    window.scrollTo({ left: 0, top: window.scrollY, behavior: "auto" });

    const contentW = content.offsetWidth;
    if (!contentW || contentW < 100) return;

    const sidebarSpace = 120;
    const viewportW = (window.innerWidth - sidebarSpace) / 0.9;

    let scale = viewportW / contentW;

    if (scale < 1.1) scale = 1.25;
    if (scale > 2.8) scale = 2.8;

    target.style.zoom = scale;
  }

  function toggleImmersive() {
    const btn = document.getElementById("gm-immersive-btn");
    const content =
      document.querySelector(".article-holder") ||
      document.querySelector(".opus-detail");
    const target = document.querySelector(".opus-detail") || content;

    if (document.body.classList.contains("gm-immersive-mode")) {
      document.body.classList.remove("gm-immersive-mode");
      document.body.style.zoom = "";
      if (btn) btn.innerHTML = ICONS.full;
      if (target) target.style.zoom = "";
      GM_setValue("immersiveMode", false);
    } else {
      document.body.classList.add("gm-immersive-mode");
      document.body.style.zoom = "0.9";
      if (btn) btn.innerHTML = ICONS.exitFull;
      moveSidebar();
      requestAnimationFrame(() => {
        performSmartZoom();
      });
    }
  }

  // --- 侧栏默认收纳逻辑 ---
  function initSidebarInteraction() {
    const wrap = document.querySelector(".right-sidebar-wrap");
    if (!wrap) return;

    let trigger = document.getElementById("gm-sidebar-trigger");
    if (!trigger) {
      trigger = document.createElement("div");
      trigger.id = "gm-sidebar-trigger";
      document.body.appendChild(trigger);
      trigger.addEventListener("mouseenter", () => {
        if (wrap.classList.contains("gm-collapsed")) {
          wrap.classList.add("gm-hover-show");
        }
      });
    }

    if (!document.getElementById("gm-collapse-btn")) {
      const container = document.querySelector(".side-toolbar");
      if (container) {
        const btn = document.createElement("div");
        btn.id = "gm-collapse-btn";
        btn.innerHTML = ICONS.lock;
        btn.title = "锁定/解锁自动收起";

        btn.onclick = () => {
          if (wrap.classList.contains("gm-collapsed")) {
            wrap.classList.remove("gm-collapsed");
            wrap.classList.remove("gm-hover-show");
            trigger.style.display = "none";
            btn.innerHTML = ICONS.arrowRight;
            btn.title = "收起侧边栏";
          } else {
            wrap.classList.add("gm-collapsed");
            trigger.style.display = "block";
            btn.innerHTML = ICONS.lock;
            btn.title = "锁定侧边栏";
          }
        };
        container.appendChild(btn);
      }
    }

    if (!wrap.classList.contains("gm-init-done")) {
      wrap.classList.add("gm-collapsed");
      wrap.classList.add("gm-init-done");
      if (trigger) trigger.style.display = "block";
    }

    // 鼠标移出：只有在目录没开时，才自动收纳
    wrap.addEventListener("mouseleave", () => {
      // 检查目录状态
      const catalog = document.querySelector(".opus-collection") || document.querySelector(".collection-m-popover");
      const isCatalogOpen = catalog && catalog.style.display !== "none";

      if (wrap.classList.contains("gm-collapsed") && !isCatalogOpen) {
        wrap.classList.remove("gm-hover-show");
      }
    });
  }

  // 【核心修改】全局点击监听器 (Global Click Listener)
  function initGlobalClickObserver() {
      document.addEventListener('click', (e) => {
          const wrap = document.querySelector(".right-sidebar-wrap");
          const sidebar = document.querySelector(".side-toolbar");
          const popup = document.querySelector(".opus-collection") || document.querySelector(".collection-m-popover");

          // 如果点击的既不是侧边栏内部，也不是目录内部
          const clickedInsideSidebar = sidebar && sidebar.contains(e.target);
          const clickedInsidePopup = popup && popup.contains(e.target);

          if (!clickedInsideSidebar && !clickedInsidePopup && wrap) {
              // 1. 如果目录开着，先关闭目录
              if (popup && popup.style.display !== 'none') {
                  const catalogBtn = document.querySelector(".side-toolbar__action.collection");
                  if (catalogBtn) catalogBtn.click(); // 触发原生关闭
                  popup.style.display = 'none'; // 兜底隐藏
              }

              // 2. 【强制】移除侧边栏的显示状态
              // 无论之前有没有目录，只要点外面，就意味着用户想结束操作
              if (wrap.classList.contains("gm-collapsed")) {
                  wrap.classList.remove("gm-hover-show");
                  wrap.classList.remove("gm-catalog-open");
              }
          }
      });
  }

  function initCatalogEnhancer() {
    const wrap = document.querySelector(".right-sidebar-wrap");

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (
              node.nodeType === 1 &&
              node.classList &&
              node.classList.contains("opus-collection__header")
            ) {
              const popup = node.parentElement;
              if (popup) {
                // 注入关闭按钮
                if (!node.querySelector("#gm-catalog-close")) {
                  const closeBtn = document.createElement("div");
                  closeBtn.id = "gm-catalog-close";
                  closeBtn.innerHTML = ICONS.close;
                  closeBtn.onclick = (e) => {
                    // 点击关闭按钮时，也模拟点击外部的效果
                    e.stopPropagation();
                    const catalogBtn = document.querySelector(".side-toolbar__action.collection");
                    if(catalogBtn) catalogBtn.click();
                    popup.style.display = 'none';
                    if(wrap) {
                        wrap.classList.remove("gm-catalog-open");
                        wrap.classList.remove("gm-hover-show");
                    }
                  };
                  node.appendChild(closeBtn);
                }

                // 监听目录显示/隐藏，联动侧边栏锁定
                const styleObserver = new MutationObserver(() => {
                  if (popup.style.display !== "none") {
                    if(wrap) wrap.classList.add("gm-catalog-open");
                  } else {
                    if(wrap) wrap.classList.remove("gm-catalog-open");
                  }
                });
                styleObserver.observe(popup, {
                  attributes: true,
                  attributeFilter: ["style"],
                });

                if (popup.style.display !== "none") {
                  if(wrap) wrap.classList.add("gm-catalog-open");
                }
              }
            }
          });
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function initInterceptor() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        const cls = (node.className || '').toString();
                        const txt = node.innerText || '';

                        if (cls.includes('toast') && !cls.includes('popup')) {
                            if (txt.includes('硬币') || txt.includes('币')) return;
                            if (txt.length > 0 && txt.length < 30) {
                                showToast(txt);
                                node.style.display = 'none';
                            }
                        }

                        if (node.closest('.side-toolbar') || node.closest('.side-toolbar__action')) {
                            if (txt.includes('成功') || txt.includes('已')) {
                                 showToast(txt);
                                 node.style.display = 'none';
                            }
                        }
                    }
                });
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function injectElements() {
    const container =
      document.querySelector(".side-toolbar__box") ||
      document.querySelector(".side-toolbar");
    if (!container) return;

    moveSidebar();
    fixButtonText();
    initSidebarInteraction();
    initCatalogEnhancer();
    initGlobalClickObserver(); // 启动全局点击监听
    initInterceptor();

    if (!document.getElementById("gm-immersive-btn")) {
      const btn = document.createElement("div");
      btn.id = "gm-immersive-btn";
      btn.className = "side-toolbar__action";
      btn.innerHTML = ICONS.full;
      btn.title = "铺满/还原";
      btn.onclick = toggleImmersive;
      btn.style.minHeight = "36px";
      btn.style.justifyContent = "center";
      container.insertBefore(btn, container.firstChild);
    }
  }

  const observer = new MutationObserver(() => {
    injectElements();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  let resizeTimer;
  window.addEventListener("resize", () => {
    if (document.body.classList.contains("gm-immersive-mode")) {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(performSmartZoom, 100);
    }
  });

  setTimeout(() => {
    injectElements();
    initCatalogEnhancer();
  }, 1000);

})();