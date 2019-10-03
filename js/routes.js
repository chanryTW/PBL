angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
    
  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'loginCtrl'
  })

  .state('choose_class', {
    params:{"StuID":null},
    url: '/choose_class',
    templateUrl: 'templates/choose_class.html',
    controller: 'choose_classCtrl'
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

  .state('menu.chatroom', {
    url: '/chatroom',
    views: {
      'side-menu21': {
        templateUrl: 'templates/chatroom.html',
        controller: 'chatroomCtrl'
      }
    }
  })

  .state('menu.vote', {
    url: '/vote',
    views: {
      'side-menu21': {
        templateUrl: 'templates/vote.html',
        controller: 'voteCtrl'
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

  .state('menu.point', {
    url: '/point',
    views: {
      'side-menu21': {
        templateUrl: 'templates/point.html',
        controller: 'pointCtrl'
      }
    }
  })

  .state('menu.irs', {
    params:{"TestID":null,"TestName":null,"TestContent":null},
    url: '/irs',
    views: {
      'side-menu21': {
        templateUrl: 'templates/irs.html',
        controller: 'irsCtrl'
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

  .state('menu.setting', {
    url: '/setting',
    views: {
      'side-menu21': {
        templateUrl: 'templates/setting.html',
        controller: 'settingCtrl'
      }
    }
  })

  // 教師版
  .state('rootmenu', {
    url: '/rootmenu',
    templateUrl: 'templates/root/root_menu.html',
    controller: 'rootmenuCtrl'
  })

  .state('rootmenu.root_pbl', {
    url: '/root_pbl',
    views: {
      'side-menu21': {
        templateUrl: 'templates/root/root_pbl.html',
        controller: 'root_pblCtrl'
      }
    }
  })

  .state('rootmenu.root_group', {
    url: '/root_group',
    views: {
      'side-menu21': {
        templateUrl: 'templates/root/root_group.html',
        controller: 'root_groupCtrl'
      }
    }
  })

  .state('rootmenu.root_mission', {
    url: '/root_mission',
    views: {
      'side-menu21': {
        templateUrl: 'templates/root/root_mission.html',
        controller: 'root_missionCtrl'
      }
    }
  })

  .state('rootmenu.root_point', {
    url: '/root_point',
    views: {
      'side-menu21': {
        templateUrl: 'templates/root/root_point.html',
        controller: 'root_pointCtrl'
      }
    }
  });

$urlRouterProvider.otherwise('/login');
});