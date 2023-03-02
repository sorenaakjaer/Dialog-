const params = new URLSearchParams(window.location.search)
var version = params.get('VERSION')
var random_id = new Date().valueOf();
var external_path = 'https://cdn.jsdelivr.net/gh/sorenaakjaer/Dialog-@' + version + '/'

var v_style1 = external_path + 'base-cbb.css' + '?' + random_id;
var v_style2 = external_path + 'style.css' + '?' + random_id;
var v_js1 = external_path + 'js-scripts.js'; //+ '?' + random_id;
var v_js2 = external_path + 'vue-scripts.js'; //+ '?' + random_id;
var v_js3 = external_path + 'server.js'; //+ '?' + random_id;
var v_html = external_path +'main.html' + '?' + random_id;

Http.open("GET", external_path.replace('cdn.','purge.') + 'base-cbb.css');
Http.send();
Http.onreadystatechange = (e) => {
  console.log(Http.responseText)
}
Http.open("GET", external_path.replace('cdn.','purge.') + 'style.css');
Http.send();
Http.onreadystatechange = (e) => {
  console.log(Http.responseText)
}
Http.open("GET", external_path.replace('cdn.','purge.')+ 'js-scripts.js');
Http.send();
Http.open("GET", external_path.replace('cdn.','purge.') + 'vue-scripts.js');
Http.send();
Http.open("GET", external_path.replace('cdn.','purge.') + 'server.js');
Http.send();
Http.open("GET", external_path.replace('cdn.','purge.') + 'main.html');
Http.send();

  $('head').append('<link rel="stylesheet" href="'+ v_style1 +'" type="text/css" />');
  $('head').append('<link rel="stylesheet" href="'+ v_style2 +'" type="text/css" />');
  $("#c_body").load(v_html);
  $.getScript(v_js1, function () { });
  $.getScript(v_js2, function () { });

