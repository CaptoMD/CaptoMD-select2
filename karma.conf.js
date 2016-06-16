module.exports = function (config)
{
    "use strict";

    config.set({

        files: [
            {pattern: "bower_components/jquery/dist/jquery.js", watched: false},
            {pattern: "bower_components/select2/select2.js", watched: false},
            {pattern: "bower_components/angular/angular.js", watched: false},
            {pattern: "bower_components/angular-mocks/angular-mocks.js", watched: false},

            "src/**/*.js",

            // Test Specs
            "test/unit/**/*.js"
        ],

        frameworks: [
            "jasmine-jquery",
            "jasmine",
            "jasmine-matchers"
        ]
    });
};
