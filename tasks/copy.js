/**
 * copy
 * ====
 *
 * Copies remaining files to places other tasks can use.
 *
 * Link: https://github.com/gruntjs/grunt-contrib-copy
 */

'use strict';

module.exports = function (grunt) {
  return {
    dist: {
      files: [
        {
          dest: '<%= pkg.config.dist %>/',
          src: 'LICENSE'
        },
        {
          expand: true,
          flatten: true,
          cwd: '<%= pkg.config.src %>/scripts/',
          dest: '<%= pkg.config.dist %>/',
          src: '**.css'
        }
      ]
    }
  };
};
