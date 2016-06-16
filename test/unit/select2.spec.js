describe("Select2", function ()
{
    beforeEach(module("rt.select2"));

    var $timeout;
    var $rootScope;
    var $document;

    beforeEach(inject(function (_$timeout_, _$rootScope_, _$document_) {
        $timeout = _$timeout_;
        $rootScope = _$rootScope_;
        $document = _$document_;
    }));

    afterEach(function () {
        $timeout.verifyNoPendingTasks();
    });

    describe("remote load options", function ()
    {
        var html = "<form><input id=\"test-input\" type=\"text\" ng-model=\"model.value\" /><select2 id=\"test-select2\" ng-model=\"model.value\" options=\"{query: query, initSelection: initSelection}\"></select2></form>";
        var element;

        beforeEach(function () {

            $rootScope.query = jasmine.createSpy("query").and.callFake(function (query) {
                query.callback({
                    results: [
                        { id: 1, text: "A" },
                        { id: 2, text: "B" }
                    ]
                });
            });

            $rootScope.initSelection = jasmine.createSpy("initSelection").and.callFake(function (viewValue, callback) {

                if (viewValue)
                {
                    callback({ id: viewValue, text: "INIT" });
                }
                else
                {
                    callback();
                }
            });
        });

        it("should init select2", inject(function ($compile) {
            element = $compile(html)($rootScope.$new());
            $rootScope.$digest();
            $timeout.flush();

            expect($rootScope.query).not.toHaveBeenCalled();
            expect($rootScope.initSelection).toHaveBeenCalled();
            expect($rootScope.initSelection.calls.count()).toBe(1);
        }));

        fit("should init select2", inject(function ($compile) {

            $rootScope.model = { value: 1 };

            element = $compile(html)($rootScope.$new());
            $rootScope.$digest();
            $timeout.flush();

            expect($rootScope.query).not.toHaveBeenCalled();
            expect($rootScope.initSelection).toHaveBeenCalled();
            expect($rootScope.initSelection.calls.count()).toBe(1);
        }));

    });
});
