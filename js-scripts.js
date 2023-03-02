// import VUE
$.getScript(
    "https://cdn.jsdelivr.net/npm/vue@2"
    //"https://cdn.jsdelivr.net/npm/vue@2/dist/vue.js"
    , function (data, textStatus, jqxhr) {
        //console.log('VUW imported')
        $(document).trigger('trigger::vue_loaded');
    })