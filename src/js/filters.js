angular.module('rede')

.filter('parseUrl', [
  function() {

    var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/gi;

    return function(text) {
      if(text) {
        text = text.replace(urlPattern, '<a target="_blank" href="$&">$&</a>');
      }
      return text;
    };
  }
])

.filter('autop', [
  function() {
    return function(input) {
      if(input) {
        input = '<p>' + input.replace(/\n([ \t]*\n)+/g, '</p><p>').replace(/\n/g, '<br />') + '</p>';
      }
      return input;
    }
  }
])

.filter('trustHtml', [
  '$sce',
  function($sce) {
    return function(input) {
      if(input)
        return $sce.trustAsHtml(input);
      else
        return input;
    }
  }
]);
