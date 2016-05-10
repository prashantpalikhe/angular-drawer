/**
 * @ngdoc controller
 * @name ngDrawer.DrawerController
 */
(function () {
    'use strict';

    angular
        .module('ngDrawer')
        .controller('DrawerController', DrawerController);

    function DrawerController($element, $rootScope, $q) {
        var vm = this;

        var element = $element[0];

        var $drawer   = angular.element(element.querySelector('aside'));
        var $backdrop = angular.element(element.querySelector('.drawer-backdrop'));
        var $edge     = angular.element(element.querySelector('.drawer-edge'));

        var drawerWidth = $drawer[0].offsetWidth;

        var startTouch;
        var previousTouch;
        var currentTouch;
        var translateX;
        var deltaX;
        var direction;
        var startOffset;

        var animatableClass = 'is-animatable';
        var visibilityClass = 'is-visible';
        var DIRECTIONS = {
            LEFT: 'left',
            RIGHT: 'right',
            UP: 'up',
            DOWN: 'down'
        };

        var EVENTS = {
            DRAWER_SHOWN: 'drawer.shown',
            DRAWER_HIDDEN: 'drawer.hidden'
        };

        vm.isShown = false;

        vm.showDrawer = showDrawer;
        vm.hideDrawer = hideDrawer;
        vm.$onDestroy = onDestroy;

        activate();

        /**
         * @private
         *
         * @description Activation logic of the component. Binds event handlers on
         * component elements.
         */
        function activate() {
            $drawer.on('touchstart', onTouchStart);
            $drawer.on('touchmove', onTouchMove);
            $drawer.on('touchend', onTouchEnd);

            $backdrop.on('touchstart', onTouchStart);
            $backdrop.on('touchmove', onTouchMove);
            $backdrop.on('touchend', onTouchEnd);
            $backdrop.on('click', hideDrawer);

            $edge.on('touchstart', onTouchStart);
            $edge.on('touchmove', onTouchMove);
            $edge.on('touchend', onTouchEnd);
        }

        /**
         * @ngdoc method
         * @name showDrawer
         * @methodOf ngDrawer.DrawerController
         *
         * @description Shows the drawer by animating the drawer in.
         * @return {*}
         */
        function showDrawer() {
            if (vm.isShown) {
                return $q.when();
            } else {
                return $q(function showDrawerPromiseResolver(resolve) {
                    enableAnimation();

                    $drawer.addClass(visibilityClass);
                    $backdrop.addClass(visibilityClass);

                    $drawer.one('transitionend', function onDrawerShowTransitionEnd () {
                        vm.isShown = true;

                        resolve();

                        $rootScope.$broadcast(EVENTS.DRAWER_SHOWN);
                    });
                });
            }
        }

        /**
         * @ngdoc method
         * @name hideDrawer
         * @methodOf ngDrawer.DrawerController
         *
         * @description Hides the drawer by animating the drawer out.
         * @return {*}
         */
        function hideDrawer() {
            if (!vm.isShown) {
                return $q.when();
            } else {
                return $q(function hideDrawerPromiseResolver(resolve) {
                    enableAnimation();

                    $drawer.removeClass(visibilityClass);
                    $backdrop.removeClass(visibilityClass);

                    $drawer.one('transitionend', function onDrawerHideTransitionEnd () {
                        vm.isShown = false;

                        resolve();

                        $rootScope.$broadcast(EVENTS.DRAWER_HIDDEN);
                    });
                });
            }
        }

        function onTouchStart(event) {
            disableAnimation();

            startTouch = event.touches[0];
            previousTouch = startTouch;

            startOffset = $drawer[0].getBoundingClientRect().left;
        }

        function onTouchMove(event) {
            event.stopPropagation();

            currentTouch = event.touches[0];
            deltaX = currentTouch.pageX - startTouch.pageX;
            direction = getSwipeDirection(previousTouch, currentTouch);

            previousTouch = currentTouch;

            requestAnimationFrame(update);
        }

        function onTouchEnd() {
            $drawer[0].style.transform = '';
            $backdrop[0].style.opacity = '';

            if (translateX <= 0) {
                if (Math.abs(translateX) > Math.floor(drawerWidth / 2)) {
                    hideDrawer();
                } else {
                    showDrawer();
                }
            }

            deltaX = 0;
        }

        /**
         * Prepares another frame
         */
        function update() {
            if (!deltaX) {
                return;
            }

            translateX = Math.min(startOffset + deltaX, 0);

            if (direction === 'left' || direction === 'right') {

                $drawer[0].style.transform = 'translate3d(' + translateX + 'px, 0, 0)';
                $backdrop[0].style.opacity = (drawerWidth + translateX) / drawerWidth;

                requestAnimationFrame(update);
            }
        }

        /**
         * @private
         * @description Enables animating of drawer and backdrop's style values.
         */
        function enableAnimation() {
            $drawer.addClass(animatableClass);
            $backdrop.addClass(animatableClass);

            $drawer.on('transitionend', onTransitionEnd);
        }

        /**
         * @private
         * @description Disables animating of drawer and backdrop's style values.
         */
        function disableAnimation() {
            $drawer.removeClass(animatableClass);
            $backdrop.removeClass(animatableClass);

            $drawer.on('transitionend', onTransitionEnd);
        }

        function onTransitionEnd() {
            $drawer.removeClass(animatableClass);
            $backdrop.removeClass(animatableClass);

            $drawer.off('transitionend', onTransitionEnd);
        }

        /**
         * @private
         * @description Determines how the user is swiping based on two touch points.
         *
         * @param previousTouch
         * @param currentTouch
         * @returns {string}
         */
        function getSwipeDirection(previousTouch, currentTouch) {
            var x = Math.abs(previousTouch.pageX - currentTouch.pageX);
            var y = Math.abs(previousTouch.pageY - currentTouch.pageY);

            if (x >= y) {
                return currentTouch.pageX > previousTouch.pageX ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
            } else {
                return currentTouch.pageY > previousTouch.pageY ? DIRECTIONS.DOWN : DIRECTIONS.UP;
            }
        }

        /**
         * @ngdoc method
         * @name onDestroy
         * @methodOf ngDrawer.DrawerController
         *
         * @description Cleanup routine when the component is destroyed.
         */
        function onDestroy() {
            $drawer.off('touchstart', onTouchStart);
            $drawer.off('touchmove', onTouchMove);
            $drawer.off('touchend', onTouchEnd);

            $backdrop.off('touchstart', onTouchStart);
            $backdrop.off('touchmove', onTouchMove);
            $backdrop.off('touchend', onTouchEnd);
            $backdrop.off('click', hideDrawer);

            $edge.off('touchstart', onTouchStart);
            $edge.off('touchmove', onTouchMove);
            $edge.off('touchend', onTouchEnd);
        }
    }
})();