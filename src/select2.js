angular.module("rt.select2", [])
    .value("select2Config", {})
    .factory("select2Stack", function () {
        var stack = [];

        return {
            $register: function (callbackElem) {
                stack.push(callbackElem);
            },
            $unregister: function (callbackElem) {
                var idx = stack.indexOf(callbackElem);
                if (idx !== -1) {
                    stack.splice(idx, 1);
                }
            },
            closeAll: function () {
                stack.forEach(function (elem) {
                    elem.close();
                });
            }
        };
    })
    .directive("select2", function ($rootScope, $timeout, $parse, $animate, select2Config, select2Stack) {
        "use strict";

        function sortedKeys(obj) {
            var keys = [];
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
            return keys.sort();
        }

        var defaultOptions = {};
        // jscs:disable validateIndentation
        // --------------------- 0000111110000000000022220000000000000000000000333300000000000000444444444444444000000000555555555555555000000066666666666666600000000000000007777000000000000000000088888
        var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+(.*?)(?:\s+track\s+by\s+(.*?))?$/;
        // jscs:enable validateIndentation

        if (select2Config) {
            angular.extend(defaultOptions, select2Config);
        }

        return {
            require: "ngModel",
            priority: 1,
            restrict: "E",
            template: "<input type=\"hidden\">",
            replace: true,
            link: function (scope, element, attrs, controller) {

                var opts = angular.extend({}, defaultOptions, scope.$eval(attrs.options));
                var isMultiple = angular.isDefined(attrs.multiple) || opts.multiple;
                var hideSearchBox = angular.isDefined(attrs.hideSearchbox) && attrs.hideSearchbox !== "false";

                opts.multiple = isMultiple;

                // make sure ngrequired validation works
                if (isMultiple) {
                    var isEmpty = controller.$isEmpty;
                    controller.$isEmpty = function (value) {
                        return isEmpty(value) || value.length === 0;
                    };
                }

                if (attrs.emptyValue) {
                    var baseIsEmpty = controller.$isEmpty;
                    controller.$isEmpty = function isSelect2Empty(value) {
                        return baseIsEmpty(value) || value === attrs.emptyValue;
                    };
                }

                var placeholder = attrs.placeholder || attrs.emptyValue;
                if (placeholder) {
                    opts.placeholder = placeholder;
                }

                if (attrs.allowClear) {
                    opts.allowClear = attrs.allowClear;
                }

                // All values returned from Select2 are strings. This is a
                // problem if you supply integer indexes: they'll become
                // strings once passing through this directive. We keep a
                // mapping between string keys and values through the
                // optionItems object, to be able to return the correctly typed
                // value.
                var optionItems = {};
                var getOptions;

                if (attrs.s2Options) {
                    var match;
                    if (!(match = attrs.s2Options.match(NG_OPTIONS_REGEXP))) {
                        throw new Error("Invalid s2Options encountered!");
                    }

                    var displayFn = $parse(match[2] || match[1]);
                    var valuesFn = $parse(match[7]);
                    var valueName = match[4] || match[6];
                    var valueFn = $parse(match[2] ? match[1] : valueName);
                    var keyName = match[5];

                    getOptions = function (callback) {
                        optionItems = {};
                        var values = valuesFn(scope);
                        var keys = (keyName ? sortedKeys(values) : values) || [];

                        var options = [];
                        for (var i = 0; i < keys.length; i++) {
                            var locals = {};
                            var key = i;
                            if (keyName) {
                                key = keys[i];
                                locals[keyName] = key;
                            }
                            locals[valueName] = values[key];

                            var value = valueFn(scope, locals);
                            var label = displayFn(scope, locals) || "";

                            // Select2 returns strings, we use a dictionary to get
                            // back to the original value.
                            optionItems[value] = {
                                id: value,
                                text: label,
                                obj: values[key]
                            };

                            options.push(optionItems[value]);
                        }

                        callback(options);
                    };

                    opts.query = function (query) {
                        var values = valuesFn(scope);
                        var keys = (keyName ? sortedKeys(values) : values) || [];

                        var options = [];
                        for (var i = 0; i < keys.length; i++) {
                            var locals = {};
                            var key = i;
                            if (keyName) {
                                key = keys[i];
                                locals[keyName] = key;
                            }
                            locals[valueName] = values[key];

                            var value = valueFn(scope, locals);
                            var label = displayFn(scope, locals) || "";

                            if (label.toLowerCase().indexOf(query.term.toLowerCase()) > -1) {
                                options.push({
                                    id: value,
                                    text: label,
                                    obj: values[key]
                                });
                            }
                        }

                        query.callback({
                            results: options
                        });
                    };

                    // Make sure changes to the options get filled in
                    scope.$watchCollection(match[7], function () {
                        controller.$render();
                    });

                    // Force Load optionItems
                    getOptions(angular.noop);

                } else {
                    if (!opts.query) {
                        throw new Error("You need to supply a query function!");
                    }

                    var queryFn = opts.query;
                    opts.query = function (query) {
                        var cb = query.callback;
                        query.callback = function (data) {
                            for (var i = 0; i < data.results.length; i++) {
                                var result = data.results[i];
                                optionItems[result.id] = result;
                            }
                            cb(data);
                        };
                        queryFn(query);
                    };

                    getOptions = function (callback) {
                        opts.query({
                            term: "",
                            callback: function (query) {
                                callback(query.results);
                            }
                        });
                    };
                }

                function getSelection(callback) {
                    if (isMultiple) {
                        var currentValues = [];
                        for (var i = 0; i < controller.$viewValue.length; i++) {
                            var option = optionItems[controller.$viewValue[i]];
                            if (angular.isUndefined(option)) {
                                currentValues = undefined;
                                break;
                            }
                            currentValues.push(option);
                        }
                        if (angular.isDefined(currentValues)) {
                            return callback(currentValues);
                        }

                        getOptions(function (options) {
                            var selection = [];
                            for (var i = 0; i < options.length; i++) {
                                var option = options[i];
                                var viewValue = controller.$viewValue || [];
                                if (viewValue.indexOf(option.id) > -1) {
                                    selection.push(option);
                                }
                            }
                            return callback(selection);
                        });
                    } else {
                        var currentValue = optionItems[controller.$viewValue];
                        if (currentValue) {
                            return callback(currentValue);
                        }

                        getOptions(function (options) {
                            for (var i = 0; i < options.length; i++) {
                                var option = options[i];
                                if (controller.$viewValue === option.id)
                                {
                                    return callback(option);
                                }
                            }
                            return callback();
                        });
                    }
                }

                if (!opts.initSelection) {
                    opts.initSelection = function (element, callback) {
                        getSelection(callback);
                    };
                } else {
                    var _initSelection = opts.initSelection;
                    opts.initSelection = function (element, callback) {
                        if (controller.$isEmpty(controller.$viewValue)) {
                            return callback();
                        }
                        _initSelection(controller.$viewValue, function (result) {
                            if (result) {
                                optionItems[result.id] = result;
                            }
                            callback(result);
                        });
                    };
                }

                // register with the select2stack
                var controlObj = {
                    close: function () {
                        element.select2("close");
                    }
                };
                select2Stack.$register(controlObj);
                scope.$on("destroy", function () {
                    select2Stack.$unregister(controlObj);
                });

                $timeout(function () {
                    element.val(controller.$viewValue);
                    element.select2(opts);
                    element.on("change", function (e) {
                        controller.$setViewValue(e.val);
                    });

                    element.on("select2-blur", function () {
                        if (controller.$touched) {
                            return;
                        }
                        controller.$setTouched();
                    });

                    controller.$render = function () {
                        if (isMultiple) {
                            getSelection(function (selection) {
                                element.select2("data", selection);
                            });
                        } else if (element.select2("val") !== this.$viewValue) {
                            element.select2("val", this.$viewValue);
                        }
                    };

                    if (hideSearchBox) {
                        $animate.addClass(element.select2("dropdown"), "select2-searchbox-hidden");
                    }
                });
            }
        };
    });
