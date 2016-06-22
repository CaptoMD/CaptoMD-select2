module.exports = function (config)
{
  'use strict';

  config.set({

    files: [
      {pattern: 'bower_components/jquery/dist/jquery.js', watched: false},
      {pattern: 'bower_components/select2/dist/js/select2.js', watched: false},
      {pattern: 'bower_components/select2/dist/css/select2.css', watched: false},
      {pattern: 'bower_components/angular/angular.js', watched: false},
      {pattern: 'bower_components/angular-mocks/angular-mocks.js', watched: false},

      'src/**/*.js',

      // Test Specs
      'test/spec/**/*.js'
    ],

    browsers: ['Chrome'],

    reporters: ['progress', 'coverage'],

    coverageReporter: {
      reporters: [
        {type: 'html', dir: 'target/karma/html/'},
        {type: 'text-summary'}
      ]
    },

    preprocessors: {
      'src/**/*.js': ['babel', 'coverage'],
    },

    frameworks: [
      'jasmine-jquery',
      'jasmine',
      'jasmine-matchers'
    ]
  });
};
