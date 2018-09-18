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
    .directive("select2", ["$rootScope", "$timeout", "$parse", "$animate", "$q", "select2Config", "select2Stack", function ($rootScope, $timeout, $parse, $animate, $q, select2Config, select2Stack) {
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
            restrict: "E",
            require: ["ngModel", "select2"],
            template: "<input type=\"hidden\">",
            bindToController: {
                s2Query: "<",
                s2InitSelection: "<"
            },
            controller: ["$element", function Select2Controller($element) {

                this.open = function open() {
                    $element.select2("open");
                };

                this.close = function close() {
                    $element.select2("close");
                };

                var onReadyCallback = [];
                this.onReady = function onReady(callback) {
                    onReadyCallback.push(callback);
                };

                this.$postLink = function $postLink() {
                    for (var i = 0; i < onReadyCallback.length; ++i) {
                        onReadyCallback[i].apply(this);
                    }
                };

                function getValue() {
                    return $element.select2("val");
                }

                function setValue(val) {
                    $element.select2("val", val);
                }

                Object.defineProperty(this, "value", {
                    get: getValue, set: setValue
                });
            }],
            link: function (scope, element, attrs, controllers) {

                var ngModelController = controllers[0];
                var select2Controller = controllers[1];

                var opts = angular.extend({}, defaultOptions, scope.$eval(attrs.options));
                var isMultiple = angular.isDefined(attrs.multiple) || opts.multiple;
                var hideSearchBox = angular.isDefined(attrs.hideSearchbox) && attrs.hideSearchbox !== "false";

                Object.defineProperty(select2Controller, "options", {
                    value: opts
                });
                Object.defineProperty(select2Controller, "isMultiple", {
                    value: isMultiple
                });
                Object.defineProperty(select2Controller, "hideSearchBox", {
                    value: hideSearchBox
                });

                opts.multiple = isMultiple;

                if (isMultiple) {
                    var isEmpty = ngModelController.$isEmpty;
                    ngModelController.$isEmpty = function (value) {
                        return isEmpty(value) || value.length === 0;
                    };
                }

                if (attrs.emptyValue) {
                    var baseIsEmpty = ngModelController.$isEmpty;
                    ngModelController.$isEmpty = function isSelect2Empty(value) {
                        return baseIsEmpty(value) || value === attrs.emptyValue;
                    };
                }

                if (angular.isDefined(attrs.allowClear)) {
                    opts.allowClear = attrs.allowClear !== "false";
                }
                if (angular.isUndefined(opts.placeholder))
                {
                    var placeholder = attrs.placeholder || attrs.emptyValue;
                    if (placeholder) {
                        opts.placeholder = placeholder;
                    } else if (opts.allowClear) {
                        opts.placeholder = "-";
                    }
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

                    getOptions = function () {
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

                        return $q.when(options);
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
                        getOptions().then(function () {
                            ngModelController.$render();
                        });
                    });

                } else {
                    if (!opts.query && !attrs.s2Query) {
                        throw new Error("You need to supply a query function!");
                    }

                    var pristineQueryOption = opts.query;
                    opts.query = function (query) {
                        var cb = query.callback;
                        query.callback = function (data) {
                            for (var i = 0; i < data.results.length; i++) {
                                var result = data.results[i];
                                optionItems[result.id] = result;
                            }
                            cb(data);
                            ngModelController.$validate();
                        };
                        (pristineQueryOption || select2Controller.s2Query)(query);
                    };

                    getOptions = function () {
                        var deferred = $q.defer();
                        opts.query({
                            term: "",
                            callback: function (query) {
                                deferred.resolve(query.results);
                            }
                        });
                        return deferred.promise;
                    };
                }

                function getSelection(modelValue) {
                    if (ngModelController.$isEmpty(modelValue)) {
                        return $q.when(undefined);
                    }
                    if (isMultiple) {
                        var selectedOptionItems = [];
                        for (var i = 0; i < modelValue.length; i++) {
                            var option = optionItems[modelValue[i]];
                            if (angular.isUndefined(option)) {
                                selectedOptionItems = undefined;
                                break;
                            }
                            selectedOptionItems.push(option);
                        }
                        if (angular.isDefined(selectedOptionItems)) {
                            return $q.when(selectedOptionItems);
                        }

                        return getOptions().then(function (options) {
                            var selection = [];
                            for (var i = 0; i < options.length; i++) {
                                var option = options[i];
                                var viewValue = modelValue || [];
                                if (viewValue.indexOf(option.id) > -1) {
                                    selection.push(option);
                                }
                            }
                            return selection;
                        });
                    } else {
                        var currentOptionItem = optionItems[modelValue];
                        if (currentOptionItem) {
                            return $q.when(currentOptionItem);
                        }

                        return getOptions().then(function (options) {
                            for (var i = 0; i < options.length; i++) {
                                var option = options[i];
                                if (modelValue === option.id)
                                {
                                    return option;
                                }
                            }
                            return undefined;
                        });
                    }
                }

                function saveOptionItems(result) {
                    if (angular.isArray(result)) {
                        for (var i = 0; i < result.length; i++) {
                            saveOptionItems(result[i]);
                        }
                        return;
                    }
                    if (result) {
                        optionItems[result.id] = result;
                    }
                }

                if (!opts.initSelection && !attrs.s2InitSelection) {
                    opts.initSelection = function (element, callback) {
                        if (ngModelController.$isEmpty(ngModelController.$modelValue)) {
                            return callback();
                        }
                        getSelection(ngModelController.$modelValue).then(callback).then(function () { ngModelController.$validate(); });
                    };
                } else {
                    var pristineInitSelectionOption = opts.initSelection;
                    opts.initSelection = function (element, callback) {
                        if (ngModelController.$isEmpty(ngModelController.$modelValue)) {
                            return callback();
                        }
                        (pristineInitSelectionOption || select2Controller.s2InitSelection)(ngModelController.$modelValue, function (result) {
                            saveOptionItems(result);
                            callback(result);
                            ngModelController.$validate();
                        });
                    };
                }

                // register with the select2stack
                select2Stack.$register(select2Controller);
                scope.$on("$destroy", function () {
                    element.select2("destroy");
                    select2Stack.$unregister(select2Controller);
                });

                element.select2(opts);
                element.on("change", function (e) {
                    ngModelController.$setViewValue(e.val);
                });

                element.on("select2-blur", function () {
                    if (ngModelController.$touched) {
                        return;
                    }
                    ngModelController.$setTouched();
                });

                element.on("select2-open", function () {
                    scope.$emit("select2:open");
                });

                element.on("select2-close", function () {
                    scope.$emit("select2:close");
                });

                ngModelController.$render = function () {
                    if (isMultiple) {
                        getSelection(ngModelController.$viewValue).then(function (selection) {
                            element.select2("data", selection);
                        });
                    } else if (select2Controller.value !== this.$viewValue) {
                        select2Controller.value = this.$viewValue;
                    }
                };

                ngModelController.$validators.value = function valueValidation(modelValue) {
                    if (ngModelController.$isEmpty(modelValue)) {
                        return true;
                    }
                    if (isMultiple) {
                        for (var i = 0; i < modelValue.length; i++) {
                            var option = optionItems[modelValue[i]];
                            if (!option || option.invalid) {
                                return false;
                            }
                        }
                        return true;
                    } else {
                        return (optionItems[modelValue] && !optionItems[modelValue].invalid);
                    }
                };

                if (!isMultiple) {
                    attrs.$observe("placeholder", function (newValue) {
                        if (ngModelController.$isEmpty(ngModelController.modelValue)) {
                            var container = $(element.select2("container"));
                            container.find(".select2-choice").addClass("select2-default");
                            container.find(".select2-chosen").html(newValue);
                        }
                    });
                }

                if (!opts.placeholder) {
                    $animate.addClass(element.select2("container"), "select2-placeholder-hidden");
                }

                if (hideSearchBox) {
                    $animate.addClass(element.select2("dropdown"), "select2-searchbox-hidden");
                }
            }
        };
    }]);
