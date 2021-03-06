angular.module('prxNavigation', ['ui.router'])
.directive('prxLoadingBar', function ($state, $stateParams, $injector, $q, $timeout, $rootScope, $animate) {
  if (typeof window.callPhantom !== 'undefined') {
    $animate.enabled(false);
  }
  function renderDone() {
    if (typeof window.callPhantom !== 'undefined') {
      $timeout(window.callPhantom, 1);
    }
  }

  function instrument(route, scope) {
    function finish (v) {
      scope.finishedResolutions += 1;
      return v;
    }

    function error (v) {
      return $q.reject(v);
    }

    if (!route._loadingInstrumented) {
      var numResolutions = 2;
      route.resolve = route.resolve || {};
      angular.forEach(route.resolve, function (resolve, name) {
        numResolutions += 1;
        if (angular.isString(resolve)) {
          route.resolve[name] = function () {
            return $q.when($injector.get(resolve)).then(finish, error);
          };
        } else {
          route.resolve[name] = $injector.annotate(resolve);
          if (angular.isArray(resolve)) {
            resolve = resolve[resolve.length-1];
          }
          route.resolve[name].push(function () {
            return $q.when(resolve.apply(this, arguments)).then(finish, error);
          });
        }
      });

      route.resolve.minimumDelay = ['$timeout', '$q', function ($timeout, $q) {
        var deferred = $q.defer();
        $timeout(function () { deferred.resolve(true); }, 50);
        return deferred.promise.then(function () { scope.finishedResolutions += 1; });
      }];

      route._loadingResolutions = numResolutions;
      route._loadingInstrumented = true;
    }
  }

  var topScope;

  return {
    restrict: 'E',
    scope: true,
    replace: true,
    template: '<div class="loading" ng-class="{hide: hide(), reset: reset()}"><div class="bar" ng-style="barStyle()"></div></div>',
    compile: function () {
      if (typeof topScope === 'undefined') {
        topScope = $rootScope.$new(true);
        topScope.totalResolutions = 3;
        topScope.finishedResolutions = 1;
        topScope.hide = false;

        topScope.$on('$stateChangeStart', function (event, route) {
          instrument(route, topScope);
          topScope.reset = true;
          topScope.hide = false;
          topScope.finishedResolutions = 0;
          topScope.totalResolutions = route._loadingResolutions;
          $timeout(function () {
            topScope.finishedResolutions += 1;
            topScope.reset = false;
          }, 1);
        });

        topScope.$on('$stateChangeSuccess', function () {
          
          $timeout(function () {
            topScope.hide = true;
            renderDone();
          }, 10);
        });

        topScope.$on('$stateChangeError', function () {
          
          $timeout(function () {
            topScope.hide = true;
            renderDone();
          }, 10);
        });
      }

      return function link (scope) {
        scope.finishedPercent = function () {
          return ~~(topScope.finishedResolutions * 100 / topScope.totalResolutions);
        };
      
        scope.barStyle = function () {
          return { width: this.finishedPercent() + '%' };
        };

        scope.hide = function () {
          return topScope.hide;
        };

        scope.reset = function () {
          return topScope.reset;
        };
      };
    }
  };
});
