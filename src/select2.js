angular.module('rt.select2', [])
  .value('select2Config', {})
  .directive('ngSelect2', ($parse) => {
    /* eslint-disable max-len */
    // ----------------------- 0000111110000000000022220000000000000000000000333300000000000000444444444444444000000000555555555555555000000066666666666666600000000000000007777000000000000000000088888
    const NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+(.*?)(?:\s+track\s+by\s+(.*?))?$/;
    /* eslint-enable max-len */

    function parseOptions(options, scope) {
      const match = options.match(NG_OPTIONS_REGEXP);
      if (!match) {
        throw new Error('Invalid ng-select2-options encountered!');
      }

      const displayFn = $parse(match[2] || match[1]);
      const valuesFn = $parse(match[7]);
      const valueName = match[4] || match[6];
      const valueFn = $parse(match[2] ? match[1] : valueName);
      const keyName = match[5];

      const values = valuesFn(scope);
      const keys = (angular.isObject(values) ? Object.keys(values) : values) || [];

      return keys.map((key) => {
        const data = angular.isObject(values) ? values[key] : key;
        const locals = {};
        if (keyName) {
          locals[keyName] = angular.isObject(values) ? key : data[keyName];
        }
        if (valueName) {
          locals[valueName] = angular.isObject(values) ? data : data[valueName];
        }

        const id = valueFn(scope, locals);
        const text = displayFn(scope, locals) || '';
        return { id, text };
      });
    }

    return {
      require: 'ngModel',
      priority: 10,
      restrict: 'A',
      replace: true,
      link(scope, element, attrs, controller) {
        const config = {};
        if (attrs.ngSelect2Options) {
          config.data = parseOptions(attrs.ngSelect2Options, scope);
        }

        const select2 = element.select2(config);

        controller.$render = function $renderSelect2() {
          if (select2.val() !== this.$viewValue) {
            select2.val(this.$viewValue).trigger('change.select2');
          }
        };
      },
    };
  });
