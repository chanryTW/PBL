angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
    
  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'loginCtrl'
  })

  .state('menu', {
    url: '/menu',
    templateUrl: 'templates/menu.html',
    controller: 'menuCtrl'
  })

  .state('menu.pbl', {
    url: '/pbl',
    views: {
      'side-menu21': {
        templateUrl: 'templates/pbl.html',
        controller: 'pblCtrl'
      }
    }
  })

  .state('menu.mission', {
    url: '/mission',
    views: {
      'side-menu21': {
        templateUrl: 'templates/mission.html',
        controller: 'missionCtrl'
      }
    }
  })

  .state('menu.group', {
    url: '/group',
    views: {
      'side-menu21': {
        templateUrl: 'templates/group.html',
        controller: 'groupCtrl'
      }
    }
  })

  .state('menu.brainstorming', {
    url: '/brainstorming',
    views: {
      'side-menu21': {
        templateUrl: 'templates/brainstorming.html',
        controller: 'brainstormingCtrl'
      }
    }
  })

  .state('menu.proposal', {
    url: '/proposal',
    views: {
      'side-menu21': {
        templateUrl: 'templates/proposal.html',
        controller: 'proposalCtrl'
      }
    }
  })

  .state('menu.score', {
    url: '/score',
    views: {
      'side-menu21': {
        templateUrl: 'templates/score.html',
        controller: 'scoreCtrl'
      }
    }
  })

  .state('menu.setting', {
    url: '/setting',
    views: {
      'side-menu21': {
        templateUrl: 'templates/setting.html',
        controller: 'settingCtrl'
      }
    }
  })


$urlRouterProvider.otherwise('/login')


});