/**
 * @ngdoc directive
 * @name drawer
 * @restrict E
 *
 * @description
 * A drawer component.
 *
 * @param {boolean=} open Decider for whether or not to pen the drawer.
 * @param {function=} onOpened Callback function, will be called when the drawer finishes opening.
 * @param {function=} onClosed Callback function, will be called when the drawer finishes closing.
 */
(function () {
    'use strict';

    angular
        .module('drawer')
        .component('drawer', {
            controller: 'DrawerController',
            controllerAs: 'drawer',
            transclude: true,
            bindings: {
                open: '<?',
                onOpened: '&?',
                onClosed: '&?'
            },
            template: '<div class="drawer-backdrop"></div><div class="drawer-edge"></div><aside class="drawer" ng-transclude></aside>'
        });
})();