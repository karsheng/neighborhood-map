module.exports = function(grunt) {

  grunt.initConfig({
    htmlmin: {
      dist: {
        options: {
          removeComments: true,
          collapseWhitespace: true,
          minifyJS: true,
          minifyCSS: true
        },
        files: {
          'dist/index.html': 'src/index.html'
        }
      }
    },

    uglify: {
      options:{
        mangle: false
      },
      my_target: {
        files: {
          'dist/js/app.js' : ['src/js/app.js']
        }
      }
    },

    cssmin: {
      target: {
        files: [{
          expand: true,
          cwd: 'src/css',
          src: ['*.css', '!*min.css'],
          dest: 'dist/css',
          ext: '.css'
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.registerTask('default', ['htmlmin'], ['uglify'], ['cssmin']);

};
