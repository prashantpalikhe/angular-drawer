/**
 * @ngdoc controller
 * @name DrawerController
 *
 * @description
 * This is the controller for the ngDrawer component.
 */
(function () {
    'use strict';

    angular
        .module('drawer')
        .controller('DrawerController', DrawerController);

    DrawerController.$inject = [
        '$scope',
        '$element',
        '$document',
        '$window'
    ];

    function DrawerController($scope, $element, $document, $window) {
        var vm = this;
        var element = $element[0];
        var docElement = angular.element($document[0].documentElement);
        var drawer = angular.element(element.querySelector('.drawer'));
        var backdrop = angular.element(element.querySelector('.drawer-backdrop'));
        var drawerWidth = drawer[0].offsetWidth;
        var primarySwipeAxis = null;
        var isOpened = false;
        var isSwiping = false;
        var startX;
        var startTime;
        var startTouch;
        var startOffset;
        var translateX;
        var deltaX;
        var animationFrameId;
        var transitionEndCallback;
        var THRESHOLD = {
                VELOCITY: 0.5, // px/ms
                DISTANCE: 10  // px
            };
        var CLASS = {
            OPEN: 'is-open',
            ANIMATABLE: 'is-animatable'
        };
        var DIRECTION = {
            LEFT: 'left',
            RIGHT: 'right'
        };
        var SWIPE_AXIS = {
            X: 'x',
            Y: 'y'
        };
        var transformKeys = [
            'webkitTransform',
            'transform',
            '-webkit-transform',
            'webkit-transform',
            '-moz-transform',
            'moz-transform',
            'MozTransform',
            'mozTransform',
            'msTransform'
        ];
        var transitionKeys = [
            'webkitTransition',
            'mozTransition',
            'msTransition',
            'transition'
        ];
        var CSS = {
            TRANSFORM: getTransformProperty(),
            TRANSITION_END: getTransitionEvent()
        };

        vm.$onInit = onInit;
        vm.$onChanges = onChanges;
        vm.$onDestroy = onDestroy;

        /**
         * @ngdoc method
         * @name onInit
         * @methodOf DrawerController
         *
         * @description
         * Drawer initialization routine.
         */
        function onInit() {
            bindEvents();
        }

        /**
         * @ngdoc method
         * @name onChanges
         * @methodOf DrawerController
         *
         * @description
         * Called when any bindings to the drawer component changes.
         *
         * @param {object} changesObj Changes object.
         */
        function onChanges(changesObj) {
            if (angular.isDefined(changesObj.open) && changesObj.open.currentValue === !isOpened) {
                if (changesObj.open.currentValue === true) {
                    openDrawer();

                } else {
                    closeDrawer();
                }
            }
        }

        /**
         * @ngdoc method
         * @name onDestroy
         * @methodOf DrawerController
         *
         * @description
         * Drawer destruction routine.
         */
        function onDestroy() {
            unbindEvents();
            cancelPendingUpdate();
            removeTransitionEndCallback();
        }

        /**
         * @private
         *
         * @description
         * Binds event handlers to the drawer elements.
         */
        function bindEvents() {
            $element.on('touchstart', onTouchStart);
            $element.on('touchmove', onTouchMove);
            $element.on('touchend', onTouchEnd);
            $element.on('touchcancel', onTouchEnd);

            backdrop.on('click', closeDrawer);
        }

        /**
         * @private
         *
         * @description
         * Unbinds event handlers from the drawer elements.
         */
        function unbindEvents() {
            $element.off('touchstart', onTouchStart);
            $element.off('touchmove', onTouchMove);
            $element.off('touchend', onTouchEnd);
            $element.off('touchcancel', onTouchEnd);

            backdrop.off('click', closeDrawer);
        }

        /**
         * @private
         *
         * @description
         * Opens the drawer by animating the drawer in.
         */
        function openDrawer() {
            enableAnimation();

            if (isOpened) {
                return;
            }

            isOpened = true;

            drawer.addClass(CLASS.OPEN);
            backdrop.addClass(CLASS.OPEN);

            addTransitionEndCallback(function onDrawerOpened() {
                if (angular.isFunction(vm.onOpened)) {
                    $scope.$apply(vm.onOpened);
                }
            });
        }

        /**
         * @private
         *
         * @description
         * Closes the drawer by animation the drawer out.
         */
        function closeDrawer() {
            enableAnimation();

            if (!isOpened) {
                return;
            }

            isOpened = false;

            drawer.removeClass(CLASS.OPEN);
            backdrop.removeClass(CLASS.OPEN);

            addTransitionEndCallback(function onDrawerClosed() {
                if (angular.isFunction(vm.onClosed)) {
                    $scope.$apply(vm.onClosed);
                }
            });
        }

        /**
         * @private
         *
         * @description
         * Enables transition support on drawer and backdrop.
         */
        function enableAnimation() {
            drawer.addClass(CLASS.ANIMATABLE);
            backdrop.addClass(CLASS.ANIMATABLE);

            drawer.one(CSS.TRANSITION_END, disableAnimation);
        }

        /**
         * @private
         *
         * @description
         * Disables transition support on drawer and backdrop.
         */
        function disableAnimation() {
            drawer.removeClass(CLASS.ANIMATABLE);
            backdrop.removeClass(CLASS.ANIMATABLE);
        }

        /**
         * @private
         *
         * @description
         * Invoked when user starts dragging the drawer.
         */
        function onTouchStart(event) {
            startTouch = getNormalizedTouch(event);
            startX = startTouch.pageX;
            startTime = Date.now();
            startOffset = drawer[0].getBoundingClientRect().left;
        }

        /**
         * @private
         *
         * @description
         * Invoked when user is dragging the drawer.
         */
        function onTouchMove(event) {
            var newTouch = getNormalizedTouch(event),
                newX = newTouch.pageX,
                swipingOnXAxis = (getPrimarySwipeAxis(startTouch, newTouch) === SWIPE_AXIS.X);

            cancelPendingUpdate();

            if (swipingOnXAxis) {
                // Disable vertical scroll
                event.preventDefault();

                if (!isSwiping && Math.abs(newX - startX) > THRESHOLD.DISTANCE) {
                    startX = newX;

                    isSwiping = true;

                    disableAnimation();
                }

                if (isSwiping) {
                    deltaX = newX - startX;

                    animationFrameId = $window.requestAnimationFrame(update);
                }
            }
        }

        /**
         * @private
         *
         * @description
         * Invoked when user stops dragging the drawer.
         */
        function onTouchEnd(event) {
            drawer[0].style[CSS.TRANSFORM] = '';
            backdrop[0].style.opacity = '';

            if (isSwiping) {
                isSwiping = false;

                snapDrawer(event);
            }

            primarySwipeAxis = null;

            cancelPendingUpdate();
        }

        /**
         * @private
         *
         * @description
         * Snaps the drawer open or shut depending on the fling velocity
         * or how far the drawer is dragged.
         *
         * @param event
         */
        function snapDrawer(event) {
            var newTouch = getNormalizedTouch(event),
                deltaTime = Date.now() - startTime,
                velocityX = Math.abs(deltaX / deltaTime),
                direction;

            direction = getSwipeDirection(startTouch, newTouch);

            if (velocityX > THRESHOLD.VELOCITY) {
                // High velocity

                if (direction === DIRECTION.LEFT) {
                    closeDrawer();

                } else {
                    openDrawer();
                }

            } else {
                // Low velocity

                if (Math.abs(translateX) > Math.floor(drawerWidth / 2)) {
                    closeDrawer();

                } else {
                    openDrawer();
                }
            }
        }

        /**
         * @private
         *
         * @description
         * Creates next frame.
         */
        function update() {
            // -1 to make sure we always trigger animation
            translateX = Math.min(startOffset + deltaX, -1);

            drawer[0].style[CSS.TRANSFORM] = 'translate3d(' + translateX + 'px, 0, 0)';
            backdrop[0].style.opacity = (drawerWidth + translateX) / drawerWidth;
        }

        /**
         * @private
         *
         * @description
         * Cancels any queued update callback.
         */
        function cancelPendingUpdate() {
            if (angular.isDefined(animationFrameId)) {
                $window.cancelAnimationFrame(animationFrameId);
            }
        }

        /**
         * @private
         *
         * @description
         * Gets the primary axis on which the user is swiping. If the user has swiped
         * more than 20px on that axis, we lock the axis.
         *
         * @param startTouch
         * @param newTouch
         * @returns {string}
         */
        function getPrimarySwipeAxis(startTouch, newTouch) {
            var xDistance,
                yDistance,
                swipeAxis;

            // We already figured out which way the user is scrolling
            if (primarySwipeAxis) {
                return primarySwipeAxis;
            }

            xDistance = Math.abs(startTouch.pageX - newTouch.pageX);
            yDistance = Math.abs(startTouch.pageY - newTouch.pageY);

            swipeAxis = (xDistance < yDistance ? SWIPE_AXIS.Y : SWIPE_AXIS.X);

            if (Math.max(xDistance, yDistance) > 30) {
                primarySwipeAxis = swipeAxis;
            }

            return swipeAxis;
        }

        /**
         * @private
         * @description
         * Determines how the user is swiping based on two touch points.
         *
         * @param previousTouch
         * @param currentTouch
         * @returns {string}
         */
        function getSwipeDirection(previousTouch, currentTouch) {
            if (currentTouch.pageX > previousTouch.pageX) {
                return DIRECTION.RIGHT;

            } else {
                return DIRECTION.LEFT;
            }
        }

        /**
         * @private
         *
         * @description
         * Gets normalized touch object from native touch event. We need to do this to
         * create snapshots of touch coordinates.
         *
         * @param touchEvent
         * @returns {{pageX: *, pageY: *}}
         */
        function getNormalizedTouch(touchEvent) {
            var touch;

            if (angular.isDefined(touchEvent.changedTouches) && touchEvent.changedTouches.length > 0) {
                touch = touchEvent.changedTouches[0];

            } else {
                touch = touchEvent.touches[0];
            }

            return {
                pageX: touch.pageX,
                pageY: touch.pageY
            };
        }

        /**
         * @private
         *
         * @description
         * Adds transition end callback to the drawer.
         *
         * @param callback
         */
        function addTransitionEndCallback(callback) {
            removeTransitionEndCallback();

            if (angular.isFunction(callback)) {
                transitionEndCallback = callback;

                drawer.one(CSS.TRANSITION_END, transitionEndCallback);
            }
        }

        /**
         * @private
         *
         * @description
         * Removes transition end callback from the drawer.
         */
        function removeTransitionEndCallback() {
            if (angular.isFunction(transitionEndCallback)) {
                drawer.off(CSS.TRANSITION_END, transitionEndCallback);

                transitionEndCallback = null;
            }
        }

        /**
         * @private
         * 
         * @description
         * Gets transform property for current platform.
         *
         * @returns {string}
         */
        function getTransformProperty() {
            for (var i = 0; i < transformKeys.length; i++) {
                if (angular.isDefined($document[0].documentElement.style[transformKeys[i]])) {
                    return transformKeys[i];
                }
            }

            return '';
        }

        /**
         * @private
         * 
         * @description
         * Gets transition property for current platform.
         * 
         * @returns {string}
         */
        function getTransitionProperty() {
            for (var i = 0; i < transitionKeys.length; i++) {
                if (angular.isDefined($document[0].documentElement.style[transitionKeys[i]])) {
                    return transitionKeys[i];
                }
            }

            return '';
        }

        /**
         * @private
         * 
         * @description
         * Gets transition event name for current platform.
         * 
         * @returns {string}
         */
        function getTransitionEvent() {
            var transitionProperty = getTransitionProperty(),
                isWebkit = transitionProperty.indexOf('webkit') !== -1,
                transitionEvent = '';

            if (transitionProperty !== '') {
                if (isWebkit) {
                    transitionEvent = 'webkitTransitionEnd';

                } else {
                    transitionEvent = 'transitionend';
                }
            }

            return transitionEvent;
        }
    }
})();