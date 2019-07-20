angular.module('app.controllers', [])

// ----------------------------------------登入頁面----------------------------------------
.controller('loginCtrl', ['$scope', '$stateParams', '$ionicPopup', '$state', '$ionicLoading',
function ($scope, $stateParams, $ionicPopup, $state, $ionicLoading) {
    // 登入
    $scope.loginSmtBtn = function() {
        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>登入中...</p>'});
        firebase.auth().signInWithEmailAndPassword(accountL.value+"@nkust.edu.tw", pwdL.value).then(function(){
            // localStorage.setItem("LoginWay", "Signin"); // 登入方式標記為 首頁登入
            console.log("登入成功");
            var StuID = accountL.value;
            accountL.value="";
            pwdL.value="";
            $ionicLoading.hide();
            $state.go("choose_class",{StuID:StuID});
            
        }).catch(function(error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log("登入失敗：",errorMessage);
            $ionicLoading.hide();
            switch(errorCode){
                case 'auth/user-not-found':
                    var alertPopup = $ionicPopup.alert({
                        title: '登入失敗',
                        template: '查無此帳號。'
                    });
                        alertPopup.then(function(res) {
                        accountL.value="";
                        pwdL.value="";
                    });
                    break;
                case 'auth/invalid-email':
                    var alertPopup = $ionicPopup.alert({
                        title: '登入失敗',
                        template: '格式有誤。'
                    });
                        alertPopup.then(function(res) {
                        accountL.value="";
                    });
                    break;
                case 'auth/wrong-password':
                    var alertPopup = $ionicPopup.alert({
                        title: '登入失敗',
                        template: '密碼錯誤。'
                    });
                        alertPopup.then(function(res) {
                        pwdL.value="";
                    });
                    break;
            }
        });
    };

}])

// ----------------------------------------選擇課程頁面----------------------------------------
.controller('choose_classCtrl', ['$scope', '$stateParams', '$state', '$ionicLoading', '$timeout',
function ($scope, $stateParams, $state, $ionicLoading, $timeout) {
    $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>匯入課程中...</p>'});
    var a = [];
    var db = firebase.firestore();
    db.collection("課程").where("學生名單", "array-contains", $stateParams.StuID)
    .get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            a.push(doc.data());
            $scope.items = a;
        });
    });

    // 定時重整
    $scope.onTimeout = function(){
        $state.go($state.current, {}, {reload: true}); //重新載入view
        mytimeout = $timeout($scope.onTimeout,2000);
        console.log("重整");
    };
    var mytimeout = $timeout($scope.onTimeout,2000);

    $ionicLoading.hide();

    // 按下課程
    $scope.choose_class = function(ClassID) {
        $timeout.cancel(mytimeout);//停止計時器
        localStorage.setItem("ClassID",ClassID);
        localStorage.setItem("StuID",$stateParams.StuID);
        $state.go("menu.pbl");
    };
}])

// ----------------------------------------主頁面----------------------------------------
.controller('pblCtrl', ['$scope', '$stateParams', '$state', '$ionicPopup',
function ($scope, $stateParams, $state, $ionicPopup) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var ClassID = localStorage.getItem("ClassID");
            var StuID = localStorage.getItem("StuID");

            // 記錄登入
            // var db = firebase.database();
            // var Today=new Date(); 
            // // 取得 UTC time
            // utc = Today.getTime() + (Today.getTimezoneOffset() * 60000);
            // db.ref("/登入記錄/").push({記錄: "用戶 "+user.uid+" 登入於 "+Date(utc + (3600000*8))},
            // function(error) {
            //     if (error){
            //         console.log("記錄登入記錄失敗");
            //         console.log(error);
            //     }
            //     else{
            //         console.log("記錄登入記錄成功");
            //     }
            // });

            // 首次登入(考慮是否移除)
            db.collection("帳號").doc(StuID).get().then(function(doc) {
                if (doc.exists) {
                    console.log("成功取得使用者資料");
                } else {
                    console.log("首次登入，建立使用者資料中...");
                    db.collection("member").doc(StuID).set({
                        暱稱: StuID,
                        照片ID: "1321"
                    })
                    .then(function() {
                        console.log("首次登入，建立使用者資料成功");
                    })
                    .catch(function(error) {
                        console.error("首次登入，建立使用者資料失敗：", error);
                        $state.go("login");
                    });
                }
            });

            // 監聽 - 公告內容
            db.collection("課程").doc(ClassID)
            .onSnapshot(function(doc) {
                $scope.items = [{ClassContent:doc.data().ClassContent}];
                $state.go($state.current, {}, {reload: true}); //重新載入view
            },function(error) {
                console.error("讀取課程發生錯誤：", error);
                $state.go("login");
            });
            
            // 監聽 - 搜尋是否已有小組
            db.collection("分組").doc(ClassID).collection(ClassID).doc(StuID)
            .onSnapshot(function(doc) {
                if (doc.data().grouped === false) {//沒有小組
                    console.log("沒有小組",doc.data());
                    // 顯示創立組員按鈕
                    $scope.addGroupShow = true;
                    $scope.delGroupShow = false;
                    $state.go($state.current, {}, {reload: true}); //重新載入view
                } else if (doc.data().grouped === true) {//有小組
                    console.log("有小組",doc.data());
                    // 隱藏創立組員按鈕
                    $scope.addGroupShow = false;
                    // 顯示解散按鈕(檢查是否為組長) 
                    db.collection("分組").doc(ClassID).collection("group").where("leader", "==", StuID)
                    .get().then(function(results) {
                        if(results.empty) {
                            console.log("你非組長"); 
                        } else {
                            console.log("你是組長");
                            $scope.delGroupShow = true;
                            $state.go($state.current, {}, {reload: true}); //重新載入view
                        }
                    }).catch(function(error) { 
                        console.log("取得未分組名單發生錯誤：", error); 
                    });
                    // 監聽 - 小組狀態
                    db.collection("分組").doc(ClassID).collection("group").where("members", "array-contains", StuID)
                    .onSnapshot(function(querySnapshot) {
                        querySnapshot.forEach(function (doc) {
                            console.log("小組狀態",doc.data().members);
                        });
                    },function(error) {

                    }); 
                    $state.go($state.current, {}, {reload: true}); //重新載入view
                }
            },function(error) {
                console.log("搜尋是否已有小組發生錯誤：", error); 
            });

            // 監聽 - 搜尋是否有人邀請
            db.collection("分組").doc(ClassID).collection(ClassID).doc(StuID).collection("invite").where("respond", "==", false)
            .onSnapshot(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                    console.log("有人邀請",doc.data());//跳出邀請訊息
                });
            },function(error) {
                console.log("搜尋是否有人邀請發生錯誤：", error); 
            });

            // 創立小組
            $scope.addGroup = function() {
                // 創立小組 - 取得未分組名單
                $scope.Stus = [];
                db.collection("分組").doc(ClassID).collection(ClassID).where("grouped", "==", false)
                .get().then(function(results) {
                    if(results.empty) {
                        console.log("全班都已分組"); 
                    } else {
                        results.forEach(function (doc) { 
                            $scope.Stus.push({StuID:doc.id});
                        });
                    }
                    console.log("取得未分組名單：", $scope.Stus); 
                    $state.go($state.current, {}, {reload: true}); //重新載入view
                }).catch(function(error) { 
                    console.log("取得未分組名單發生錯誤：", error); 
                });
                // 創立小組 - 偵測勾選
                $scope.checkStus = [];
                $scope.check = function(Stu) {
                    // 判斷有無在陣列中，無則增加、有則刪除
                    if ($scope.checkStus.indexOf(Stu) === -1) {
                        $scope.checkStus.push(Stu);
                    } else {
                        $scope.checkStus.splice($scope.checkStus.indexOf(Stu),1);
                    }
                    console.log($scope.checkStus);
                }
                // 創立小組 - 跳出泡泡
                var confirmPopup = $ionicPopup.show({
                    title: '選擇組員',
                    subTitle: '創立後需等待對方同意加入才會加入。',
                    template: 
                        '<div ng-repeat="Stu in Stus">'+
                        '<ion-checkbox ng-click="check(Stu.StuID)">{{Stu.StuID}}</ion-checkbox>'+
                        '</div>',
                    scope: $scope,
                    buttons: [{
                        text: '取消',
                        type: 'button-default',
                        onTap: function(e) {
                            console.log('選擇取消');
                        }
                    }, {
                        text: '創立',
                        type: 'button-positive',
                        onTap: function(e) {
                            console.log('選擇創立');

                            // 創立小組 - 新增小組名單
                            db.collection("分組").doc(ClassID).collection("group")
                            .add({
                                leader: StuID,
                                members: [StuID]
                            })
                            .then(function(data) {
                                console.log("新增小組成功");
                            })
                            .catch(function(error) {
                                console.error("新增小組失敗：", error);
                            });
                            // 創立小組 - 更新入組狀態
                            db.collection("分組").doc(ClassID).collection(ClassID).doc(StuID)
                            .update({
                                grouped: true
                            })
                            .then(function(data) {
                                console.log("更新入組狀態成功");
                            })
                            .catch(function(error) {
                                console.error("更新入組狀態失敗：", error);
                            });
                        }
                    }]
                });
            };

            // 解散小組
            $scope.delGroup = function() {
                // 解散小組 - 跳出泡泡
                var confirmPopup = $ionicPopup.confirm({
                    title: '解散小組',
                    template: '確定要解散小組嗎?',
                    buttons: [{
                        text: '取消',
                        type: 'button-default',
                        onTap: function(e) {
                            console.log('選擇取消');
                        }
                    }, {
                        text: '解散',
                        type: 'button-positive',
                        onTap: function(e) {
                            console.log('選擇解散');

                            // 解散小組 - 刪除小組資料
                            db.collection("分組").doc(ClassID).collection("group").where("leader", "==", StuID)
                            .get().then(function(results) {
                                if(results.empty) {
                                    console.log("解散小組錯誤：非組長"); 
                                } else {
                                    results.forEach(function (doc) { 
                                        db.collection("分組").doc(ClassID).collection("group").doc(doc.id)
                                        .delete()
                                        .then(function(data) {
                                            console.log("解散小組成功");
                                        })
                                        .catch(function(error) {
                                            console.error("解散小組失敗：", error);
                                        });
                                    });
                                }
                            }).catch(function(error) { 
                                console.log("解散小組錯誤：", error); 
                            });
                            
                            // 解散小組 - 更新入組狀態
                            db.collection("分組").doc(ClassID).collection(ClassID).doc(StuID)
                            .update({
                                grouped: false
                            })
                            .then(function(data) {
                                console.log("更新入組狀態成功");
                            })
                            .catch(function(error) {
                                console.error("更新入組狀態失敗：", error);
                            });
                        }
                    }]
                });
            };

            // 更新menu的大頭照
            // var storage = firebase.storage();
            // var storageRef = storage.ref();
            // storageRef.child('images/'+localStorage.getItem("uid")).getDownloadURL().then(function(url) {
            //     document.getElementById("menu-img").src=url;
            // })
            // 更新選單的暱稱
            // var userId = localStorage.getItem("uid");
            // return firebase.database().ref('/使用者/' + userId).once('value').then(function(snapshot) {
            //     var username = (snapshot.val() && snapshot.val().暱稱) || 'Anonymous';
            // });
            
        }else{
            console.log("尚未登入");
            $state.go("login");
        }
    });
}])

// ----------------------------------------課程任務頁面----------------------------------------
.controller('missionCtrl', ['$scope', '$stateParams', 
function ($scope, $stateParams) {


}])
   
// ----------------------------------------分組頁面----------------------------------------
.controller('groupCtrl', ['$scope', '$stateParams', 
function ($scope, $stateParams) {


}])

// ----------------------------------------腦力激盪頁面----------------------------------------
.controller('brainstormingCtrl', ['$scope', '$stateParams', '$state', '$ionicScrollDelegate', '$ionicLoading',
function ($scope, $stateParams, $state, $ionicScrollDelegate, $ionicLoading) {
    var db = firebase.firestore();
    $scope.items = [];
    // 監聽 - 腦力激盪內容
    db.collection("腦力激盪").doc("0001").collection("g0001").orderBy("time","asc")
    .onSnapshot({
        includeMetadataChanges: true
    }, function(querySnapshot) {
        querySnapshot.docChanges().forEach(function(change) {
            if (change.type === "added") {
                console.log("新增: ", change.doc.data());
                $scope.items.push(change.doc.data());
                $state.go($state.current, {}, {reload: true}); //重新載入view
                $ionicScrollDelegate.scrollBottom(true); //滑到最下面
            }
            if (change.type === "modified") {
                console.log("修改: ", change.doc.data());
            }
            if (change.type === "removed") {
                console.log("刪除: ", change.doc.data());
                // 用findIndex找出要刪除的位置
                var indexNum = $scope.items.findIndex((element)=>{
                    return (element.time.seconds === change.doc.data().time.seconds) & (element.time.nanoseconds === change.doc.data().time.nanoseconds);
                });
                if (indexNum!=-1) {
                    $scope.items.splice(indexNum,1);
                    console.log("刪除列表成功");
                }else{
                    console.log("刪除列表不成功");
                }
                $state.go($state.current, {}, {reload: true}); //重新載入view
                $ionicScrollDelegate.scrollBottom(true); //滑到最下面
            }
        });

    });
    
    // 新增腦力激盪
    $scope.add = function() {
        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>新增中...</p>'});
        if ($scope.input!=undefined && $scope.input!="") {
            db.collection("腦力激盪").doc("0001").collection("g0001")
            .add({
                name: "廖詮睿",
                msg: $scope.input,
                time: new Date()
            })
            .then(function(data) {
                console.log("新增腦力激盪成功");
            })
            .catch(function(error) {
                console.error("新增腦力激盪失敗：", error);
            });
            $scope.input = "";
        }
        $ionicLoading.hide();
    };

    // 刪除腦力激盪
    $scope.Delete = function(item) {
        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>刪除中...</p>'});
        var query = db.collection("腦力激盪").doc("0001").collection("g0001").where("time", "==", item.time);
        query.get().then(function (querySnapshot) {
            querySnapshot.forEach(function (doc) {
                db.collection("腦力激盪").doc("0001").collection("g0001").doc(doc.id)
                .delete().then(function () {
                    console.log("刪除腦力激盪成功");
                }).catch(function(error) {
                    console.error("刪除腦力激盪失敗：", error);
                });
            });
        });
        $ionicLoading.hide();
    };


}])

// ----------------------------------------提案聚焦頁面----------------------------------------
.controller('proposalCtrl', ['$scope', '$stateParams', 
function ($scope, $stateParams) {


}])

// ----------------------------------------分組評分頁面----------------------------------------
.controller('scoreCtrl', ['$scope', '$stateParams', 
function ($scope, $stateParams) {


}])
.controller('ingroup_mutualCtrl', ['$scope', '$stateParams', 
function ($scope, $stateParams) {


}])

// ----------------------------------------設定頁面----------------------------------------
.controller('settingCtrl', ['$scope', '$stateParams', '$ionicLoading', '$ionicPopup',
function ($scope, $stateParams, $ionicLoading, $ionicPopup) {
    // 修改暱稱功能
    var SaveBtn1 = document.getElementById("page7_savebtn1");
    var uploadFileInput1 = document.getElementById("uploadFileInput1");    
    SaveBtn1.addEventListener("click",function(){
        $ionicLoading.show({ // 開始跑圈圈
            template: '更新暱稱中...'
        });
        var uid = localStorage.getItem("uid"); // 取回uid
        var db = firebase.database();
        db.ref("使用者/" + uid).update({暱稱: uploadFileInput1.value},
        function (error) {
            if (error) {
                console.log("修改失敗");
                $ionicLoading.hide();
                console.log(error);
                var alertPopup = $ionicPopup.alert({
                    title: '修改暱稱失敗',
                    template: error
                });
            }
            else {
                console.log("修改成功");
                $ionicLoading.hide();
                var alertPopup = $ionicPopup.alert({
                    title: '成功',
                    template: '暱稱修改完成。'
                });
                // 更新選單的暱稱
                var userId = localStorage.getItem("uid");
                return firebase.database().ref('/使用者/' + userId).once('value').then(function(snapshot) {
                    var username = (snapshot.val() && snapshot.val().暱稱) || 'Anonymous';
                    document.getElementById("menu-heading1").innerText = username; 
                });
            }
        });
    });
    // 上傳大頭照功能
    var SaveBtn2 = document.getElementById("page7_savebtn2");    
    var uploadFileInput2 = document.getElementById("uploadFileInput2");
    SaveBtn2.addEventListener("click",function(){
        $ionicLoading.show({ // 開始跑圈圈
            template: '上傳圖片中...'
        });
        var file = uploadFileInput2.files[0];
        var storage = firebase.storage();
        var storageRef = storage.ref();
        var uploadTask = storageRef.child('images/'+localStorage.getItem("uid")).put(file);
        uploadTask.on('state_changed', function(snapshot){
            // 取得檔案上傳狀態，並用數字顯示
            var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('已上傳 ' + progress + '%');
            switch (snapshot.state) {
                case firebase.storage.TaskState.PAUSED: 
                console.log('上傳暫停');
                break;
                case firebase.storage.TaskState.RUNNING: 
                console.log('上傳中');
                break;
            }
        }, function(error) {
            console.log("上傳失敗");
            $ionicLoading.hide();
            console.log(error);
            var alertPopup = $ionicPopup.alert({
                title: '上傳圖片失敗',
                template: error
            });
        }, function() {
            console.log("上傳成功");
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.alert({
                title: '成功',
                template: '更換照片完成。'
            });
            // 更新menu的大頭照
            var storage = firebase.storage();
            var storageRef = storage.ref();
            storageRef.child('images/'+localStorage.getItem("uid")).getDownloadURL().then(function(url) {
                document.getElementById("menu-img").src=url;
            })
        });
    },false);
   
}])

// ----------------------------------------選單頁面----------------------------------------
.controller('menuCtrl', ['$scope', '$stateParams', 
function ($scope, $stateParams) {
    // 更新使用者姓名
    document.getElementById("menu-heading1").innerText = localStorage.getItem("sname");

    // 登出
    var signOutSmtBtn = document.getElementById("menu-list-item8");
    signOutSmtBtn.addEventListener("click",function(){
        firebase.auth().signOut().then(function() {
            console.log("登出成功");
            localStorage.clear();
        }).catch(function(error) {
            console.log("登出發生錯誤!");
        });
    },false);
    
    // 設定授權文字位置
    $('#menu-heading2').css('top', window.innerHeight-620+'px');
}]);

