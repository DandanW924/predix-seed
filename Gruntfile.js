var LIVERELOAD_PORT = 35724;
var SERVER_PORT = 9001;
var RUNNER_PORT = 9002;
module.exports = function(grunt) {
    'use strict';

    // load all grunt tasks matching the `grunt-*` pattern
    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);

    // Project configuration
    grunt.initConfig({
        config: {
            app: 'public',
            test: 'test',
            artifactory: {
                'username': 'svc-dsp-reader',
                'password': '4wxKT8u8E2'
            }
        },

        //Watch and test when files change
        watch: {
            options: {
                nospawn: true,
                livereload: '<%= connect.options.livereload %>'
            },
            scripts: {
                files: ['public/scripts/**/*.js']
            },
            test: {
                files: ['test/spec/*.js'],
                tasks: [ 'jasmine' ]
            }
        },

        //Clean test directory
        clean: {
            build: [],
            test: ['test-target/'],
            artifactory: ['public/bower_components/vruntime', 'public/bower_components/iids']
        },

        //Server to load spec runner
        connect: {
            options: {
                livereload: LIVERELOAD_PORT,
                hostname: 'localhost',
                open: false
            },
            livereload: {
                options: {
                    port: RUNNER_PORT,
                    open: true,
                    base: ['public']
                }
            },
            test: {
                options: {
                    port: RUNNER_PORT,
                    base: ['.tmp', '.']
                }
            },
        },

        //Karma configuration
        karma: {
            runner: {
                configFile: 'karma.conf.js',
                singleRun: true
            }
        },

        //Protractor runner
        protractor: {
            options: {
                keepAlive: false,
                noColor: false
            },
            e2e: {
                options: {
                    configFile: "protractor.conf.js"
                }
            }
        },

        //Requirejs build config
        requirejs: {
            compile: {
                options: {
                    out: "target/public/scripts/main-optimized.js",
                    // dir: '<%= settings.dist.dir %>',
                    normalizeDirDefines: 'all',
                    optimize: 'uglify',
                    stubModules: [ 'json', 'text' ],
                    wrap: true,
                    skipDirOptimize: false,
                    include: [ 'config' ],
                    baseUrl: 'public/scripts',
                    //Since we are not using the browser and bypassing the catalog manager.
                    paths: {
                        widgets: '../../conf/components'
                    },
                    mainConfigFile: '<%= config.test %>/test-config.js',
                    done: function(done, output) {
                        var duplicates = require('rjs-build-analysis').duplicates(output);

                        if (duplicates.length > 0) {
                            grunt.log.subhead('Duplicates found in requirejs build:');
                            grunt.log.warn(duplicates);
                            done(new Error('r.js built duplicate modules, please check the excludes option.'));
                        }

                        done();
                    }
                }
            }
        },

        //Library updates with artificatory
        artifactory: {
            vclient: {
                options: {
                    url: 'https://devcloud.swcoe.ge.com',
                    repository: 'DSP',
                    username: '<%= config.artifactory.username %>',
                    password: '<%= config.artifactory.password %>',
                    fetch: [
                        {
                            // update the version here and run grunt update:vclient
                            // to upgrade to another vclient version
                            id: 'com.ge.predix.js:vruntime:zip:1.8.0',
                            path: 'public/bower_components/vruntime'
                        }
                    ]
                }
            },
            iidx: {
                options: {
                    url: 'https://devcloud.swcoe.ge.com',
                    repository: 'DSP',
                    username: '<%= config.artifactory.username %>',
                    password: '<%= config.artifactory.password %>',
                    fetch: [
                        {
                            // update the version here and run grunt update:iidx
                            // to upgrade to another iidx version
                            id: 'com.ge.predix:iidx:zip:2.1.0',
                            path: 'public/bower_components/iids'
                        }
                    ]
                }
            }
        }
    });


    grunt.registerTask('serve', [ 'clean:build', 'connect:livereload', 'watch']);
    grunt.registerTask('test', [ 'clean:test', 'karma']);
    grunt.registerTask('test:e2e', [ 'clean:test', 'protractor']);
    grunt.registerTask('default', [ 'test' ]);

    // pull the vclient/iidx distributions from artifactory (configured above)
    grunt.registerTask('update', ['clean:artifactory', 'artifactory']);
};
