'use strict';

angular.module('rt.select2', []).value('select2Config', {}).directive('ngSelect2', ["$parse", function ($parse) {
  /* eslint-disable max-len */
  // ----------------------- 0000111110000000000022220000000000000000000000333300000000000000444444444444444000000000555555555555555000000066666666666666600000000000000007777000000000000000000088888
  var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+(.*?)(?:\s+track\s+by\s+(.*?))?$/;
  /* eslint-enable max-len */

  function parseOptions(options, scope) {
    var match = options.match(NG_OPTIONS_REGEXP);
    if (!match) {
      throw new Error('Invalid ng-select2-options encountered!');
    }

    var displayFn = $parse(match[2] || match[1]);
    var valuesFn = $parse(match[7]);
    var valueName = match[4] || match[6];
    var valueFn = $parse(match[2] ? match[1] : valueName);
    var keyName = match[5];

    var values = valuesFn(scope);
    var keys = (angular.isObject(values) ? Object.keys(values) : values) || [];

    return keys.map(function (key) {
      var data = angular.isObject(values) ? values[key] : key;
      var locals = {};
      if (keyName) {
        locals[keyName] = angular.isObject(values) ? key : data[keyName];
      }
      if (valueName) {
        locals[valueName] = angular.isObject(values) ? data : data[valueName];
      }

      var id = valueFn(scope, locals);
      var text = displayFn(scope, locals) || '';
      return { id: id, text: text };
    });
  }

  return {
    require: 'ngModel',
    priority: 10,
    restrict: 'A',
    replace: true,
    link: function link(scope, element, attrs, controller) {
      var config = {};
      if (attrs.ngSelect2Options) {
        config.data = parseOptions(attrs.ngSelect2Options, scope);
      }

      var select2 = element.select2(config);

      controller.$render = function $renderSelect2() {
        if (select2.val() !== this.$viewValue) {
          select2.val(this.$viewValue).trigger('change.select2');
        }
      };
    }
  };
}]);
//# sourceMappingURL=angular-select2.js.map
