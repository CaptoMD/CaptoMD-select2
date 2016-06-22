describe('Multiple', function () {
  var TestPage = function () {
    this.textInput = element(by.id('multipleText'));
    this.select = element(by.css('#multipleSelect2 + .select2-container'));
    this.selectEntry = element(by.css('.select2-search__field'));

    this.get = function () {
      browser.get('http://localhost:9000/test/fixtures/multiple.html');
    };

    this.getInputValue = function () {
      return this.textInput.getAttribute('value');
    };

    this.setInputValue = function (value) {
      this.textInput.clear();
      this.textInput.sendKeys(value);
    };

    this.assertSelectedValues = function (values) {
      browser.findElements(by.css('.select2-selection__rendered .select2-selection__choice')).then(function (arr) {
        expect(arr.length).toEqual(values.length);
        for (var i = 0; i < values.length; i++) {
          expect(arr[i].getInnerHtml()).toEqual('<span class="select2-selection__choice__remove" role="presentation">×</span>' + values[i]);
        }
      });
    };

    this.enter = function (value) {
      this.selectEntry.sendKeys(value);
      this.selectEntry.sendKeys(protractor.Key.ENTER);
    };

    this.clickChange = function () {
      element(by.id('multipleChange')).click();
    };

    this.removeOption = function () {
      element.all(by.css('.select2-selection__choice__remove')).get(0).click();
      browser.sleep(100);
    };

    this.get();
  };

  var page;
  beforeEach(function () {
    page = new TestPage();
  });

  it('Should show selected value', function () {
    expect(page.getInputValue()).toEqual('1,3');
    page.assertSelectedValues(['One', 'Three']);
  });

  it('Should update model on entry', function () {
    page.enter('tw');
    expect(page.getInputValue()).toEqual('1,2,3');
    page.assertSelectedValues(['One', 'Two', 'Three']);
  });

  it('Should respond to scope changes', function () {
    page.clickChange();
    expect(page.getInputValue()).toEqual('2,4');
    page.assertSelectedValues(['Two', 'Four']);
  });

  it('Removing item after change updates scope', function () {
    page.clickChange();
    page.removeOption();
    expect(page.getInputValue()).toEqual('4');
    page.assertSelectedValues(['Four']);
  });
});
