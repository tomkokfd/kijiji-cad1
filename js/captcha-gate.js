(function () {
  function gc(name) {
    return document.cookie.split(";").some(function (c) {
      return c.trim().indexOf(name + "=") === 0;
    });
  }
  if (location.pathname.indexOf("/captcha") !== -1) return;
  if (gc("captcha")) return;
  var next = location.pathname + location.search + location.hash;
  location.replace("/captcha?next=" + encodeURIComponent(next));
})();
