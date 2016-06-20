(function() {
    'use strict';

    angular
        .module('app', ['drawer'])
        .controller('AppController', AppController);

    function AppController() {
        var vm = this;

        vm.isDrawerOpen = false;
    }
})();