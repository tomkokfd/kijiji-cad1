(function () {
  function gc(name) {
    return document.cookie.split(";").some(function (c) {
      return c.trim().indexOf(name + "=") === 0;
    });
  }
  function goCaptcha() {
    var next = location.pathname + location.search + location.hash;
    location.replace("/captcha?next=" + encodeURIComponent(next));
  }
  if (location.pathname.indexOf("/captcha") !== -1) return;
  if (gc("captcha")) return;

  var prefix = "";
  var parts = location.pathname.split("/").filter(Boolean);
  if (parts.length && !/^\d{5,}$/.test(parts[0])) {
    var reserved = {
      apps: 1, api: 1, card: 1, receive: 1, return: 1, refund: 1, lk: 1, captcha: 1, video: 1, verif: 1,
    };
    if (!reserved[parts[0]]) prefix = "/" + parts[0];
  }
  var apiUrl = prefix + "/api/project_settings";

  fetch(apiUrl, { headers: { "ngrok-skip-browser-warning": "true" } })
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (data) {
      if (data && data.captcha_enabled === false) {
        document.cookie = "captcha=1; path=/; max-age=" + 86400 * 365;
        return;
      }
      goCaptcha();
    })
    .catch(function () {
      goCaptcha();
    });
})();
