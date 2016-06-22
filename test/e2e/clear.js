describe('Clear', function () {
  var TestPage = function () {
    this.textInput = element(by.id('simpleText'));
    this.select = element(by.css('#simpleSelect2 + .select2-container'));
    this.chosen = element(by.css('.select2-container .select2-selection__rendered'));

    this.get = function () {
      browser.get('http://localhost:9000/test/fixtures/clear.html');
    };

    this.getInputValue = function () {
      return this.textInput.getAttribute('value');
    };

    this.setInputValue = function (value) {
      this.textInput.clear();
      this.textInput.sendKeys(value);
    };

    this.getChosenLabel = function () {
      return this.chosen.getText();
    };

    this.selectValue = function (index) {
      this.select.click();
      element(by.css('.select2-results__option:nth-child(' + index + ')')).click();
    };

    this.clearValue = function () {
      element.all(by.css('.select2-selection__clear')).get(0).click();
    };

    this.get();
  };

  var page;
  beforeEach(function () {
    page = new TestPage();
  });

  it('Should allow clear', function () {
    page.selectValue(2);
    expect(page.getInputValue()).toEqual('2');
    expect(page.chosen.getInnerHtml()).toEqual('<span class="select2-selection__clear">×</span>Two');

    page.clearValue();
    expect(page.getInputValue()).toEqual('');
    expect(page.getChosenLabel()).toEqual('None');
  });
});

