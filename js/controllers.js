/*jshint esversion: 6 */
var verson = "1.0.0";
// 1.0.0 => 正式版發佈 2019.00.00
angular.module('app.controllers', [])

// ----------------------------------------登入頁面----------------------------------------
.controller('loginCtrl', ['$scope', '$stateParams', '$ionicPopup', '$state', '$ionicLoading',
function ($scope, $stateParams, $ionicPopup, $state, $ionicLoading) {
    // 登入
    $scope.loginSmtBtn = function() {
        $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>登入中...</p>'});
        firebase.auth().signInWithEmailAndPassword(accountL.value+"@nkust.edu.tw", pwdL.value).then(function(){
            console.log("登入成功");
            var StuID = accountL.value;
            accountL.value="";
            pwdL.value="";
            $ionicLoading.hide();
            // 判斷教師版
            if (StuID=="root") {
                $state.go("rootmenu.root_pbl",{StuID:StuID});
            } else {
                $state.go("choose_class",{StuID:StuID});
            }
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

    // 忘記密碼
    $scope.forgetBtn = function() {
        $scope.data = {};
        $ionicPopup.show({
            title: '忘記密碼',
            subTitle: '請輸入學號，重設信件將寄送至nkust信箱',
            template: 
                '<input type="text" ng-model="data.forgetInput" placeholder="ex:C107193000">',
            scope: $scope,
            buttons: [{
                text: '取消',
                type: 'button-default',
                onTap: function(e) {
                    console.log('選擇取消');
                }
            }, {
                text: '送出',
                type: 'button-chanry1',
                onTap: function(e) {
                    console.log('選擇送出');
                    firebase.auth().sendPasswordResetEmail($scope.data.forgetInput+"@nkust.edu.tw").then(function() {
                        console.log("寄送密碼重置信成功");
                        var alertPopup = $ionicPopup.alert({
                            title: '成功',
                            template: '寄送密碼重置信成功，請至 '+$scope.data.forgetInput+"@nkust.edu.tw"+" 收信"
                        });
                    }).catch(function(error) {
                        console.log("寄送密碼重置信失敗");
                        switch(error.code){
                            case 'auth/user-not-found':
                                var alertPopup = $ionicPopup.alert({
                                    title: '寄信失敗',
                                    template: '查無此帳號。'
                                });
                                break;
                        }
                    });
                }
            }]
        });
    };

}])

// ----------------------------------------選擇課程頁面----------------------------------------
.controller('choose_classCtrl', ['$scope', '$stateParams', '$state', '$ionicLoading', '$timeout',
function ($scope, $stateParams, $state, $ionicLoading, $timeout) {
    $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>載入課程中...</p>'});
    var a = [];
    var db = firebase.firestore();
    db.collection("課程").where("ClassStu", "array-contains", $stateParams.StuID)
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
    $scope.choose_class = function(ClassID,ClassName) {
        $timeout.cancel(mytimeout);//停止計時器
        localStorage.setItem("ClassID",ClassID);
        localStorage.setItem("ClassName",ClassName);
        $state.go("menu.pbl");
    };
}])

// ----------------------------------------主頁面----------------------------------------
.controller('pblCtrl', ['$scope', '$stateParams', '$state', '$ionicPopup', '$ionicLoading',
function ($scope, $stateParams, $state, $ionicPopup, $ionicLoading) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@"));
            var ClassID = localStorage.getItem("ClassID");

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
            
            // 監聽 - 公告內容
            db.collection("課程").doc(ClassID)
            .onSnapshot(function(doc) {
                $scope.items = [{ClassName:doc.data().ClassName,ClassContent:doc.data().ClassContent}];
                $state.go($state.current, {}, {reload: true}); //重新載入view
            },function(error) {
                console.error("讀取課程發生錯誤：", error);
                $state.go("login");
            });

            // 監聽 - 是否開放分組
            db.collection("課程").doc(ClassID)
            .onSnapshot(function(doc) {
                $scope.LockGroupShow = doc.data().inviteLock;
                $state.go($state.current, {}, {reload: true}); //重新載入view
                console.log("是否開放分組：",$scope.LockGroupShow);
            },function(error) {
                console.error("搜尋是否開放分組發生錯誤：", error);
            });
            
            // 監聽 - 搜尋是否已有小組
            var NowGroupID = "";
            db.collection("分組").doc(ClassID).collection("student").doc(StuID)
            .onSnapshot(function(doc) {
                if (doc.data().grouped === false) {//沒有小組
                    console.log("沒有小組",doc.data());
                    // 顯示創立組員按鈕
                    $scope.leaderGroupShow = false;
                    $scope.addGroupShow = true;
                    $scope.quitGroupShow = false;
                    // 清空組員列表
                    $scope.members = [];
                    // 設定小組ID
                    localStorage.setItem("GroupID","none");
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
                            $scope.quitGroupShow = true;
                        } else {
                            console.log("你是組長");
                            results.forEach(function (doc) {
                                NowGroupID = doc.id;
                            });
                            $scope.leaderGroupShow = true;
                            $state.go($state.current, {}, {reload: true}); //重新載入view
                        }
                    }).catch(function(error) { 
                        console.log("取得未分組名單發生錯誤：", error); 
                    });
                }
            },function(error) {
                console.log("搜尋是否已有小組發生錯誤：", error); 
            });

            // 監聽 - 小組狀態
            db.collection("分組").doc(ClassID).collection("group").where("members", "array-contains", StuID)
            .onSnapshot(function(querySnapshot) {
                querySnapshot.forEach(function (doc) {
                    // 設定小組ID
                    localStorage.setItem("GroupID",doc.id);

                    $scope.members = [];
                    console.log("小組狀態",doc.data().members);
                    for (let index = 0; index < doc.data().members.length; index++) {
                        // 查詢帳號資料
                        db.collection("帳號").doc(doc.data().members[index])
                        .get().then(function(results) {
                            // 第一位是組長
                            var leaderTrue = false;
                            if (index == 0) {
                                leaderTrue = true;
                            }
                            // 獲取組員大頭照
                            var storage = firebase.storage();
                            storage.ref().child('members/'+results.data().Img).getDownloadURL().then(function(url) {
                                $scope.members.push({memberID:doc.data().members[index],memberName:results.data().Name,memberImg:url,leader:leaderTrue});
                                $state.go($state.current, {}, {reload: true}); //重新載入view
                                console.log($scope.members);
                            })
                        }).catch(function(error) { 
                            console.log("查詢帳號資料發生錯誤：", error); 
                        });
                    }
                });
            },function(error) {
                console.log("檢查小組狀態發生錯誤：", error); 
            }); 

            

            // 創立小組 or 邀請小組
            $scope.addGroup = function(InviteOrAdd) {
                $scope.Stus = [];
                // 創立小組+邀請小組 - 取得未分組名單
                $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>載入學生中...</p>'});
                db.collection("分組").doc(ClassID).collection("student").where("grouped", "==", false)
                .get().then(function(results) {
                    if(results.empty) {
                        console.log("全班都已分組"); 
                    } else {
                        results.forEach(function (doc) {
                            // 判斷不是自己才加入
                            if (doc.id!=StuID) {
                                var a = results.docs[results.docs.length-1].id;
                                // 查詢姓名
                                db.collection("帳號").doc(doc.id)
                                .get().then(function(results) {
                                    $scope.Stus.push({StuID:doc.id,Name:results.data().Name,Checked:false});
                                    $state.go($state.current, {}, {reload: true}); //重新載入view
                                    // 判斷最後一筆 關閉轉圈圈
                                    if (doc.id==a) {
                                        $ionicLoading.hide();
                                    }
                                }).catch(function(error) { 
                                    console.log("查詢姓名發生錯誤：", error); 
                                });
                            }
                        });
                    }
                    console.log("取得未分組名單：", $scope.Stus); 
                    $state.go($state.current, {}, {reload: true}); //重新載入view
                }).catch(function(error) { 
                    console.log("取得未分組名單發生錯誤：", error); 
                });

                $scope.checkStus = [];
                // 取得課程組員上限
                db.collection("課程").doc(ClassID)
                .get().then(function(maxData) {
                    // 創立小組時 把自己算進去
                    var a = 0;
                    if ($scope.members.length==0) {
                        a = 1;
                    } else {
                        a = $scope.members.length;
                    }
                    // 顯示已選數 預載
                    $scope.maxMember = {now:a+$scope.checkStus.length,maxMember:maxData.data().maxMembers};

                    // 創立小組+邀請小組 - 偵測勾選
                    $scope.check = function(Stu) {
                        // 判斷有無在陣列中，無則增加、有則刪除
                        if ($scope.checkStus.indexOf(Stu) === -1) {
                            $scope.checkStus.push(Stu);
                        } else {
                            $scope.checkStus.splice($scope.checkStus.indexOf(Stu),1);
                        }
                        // 判斷是否超過組員上限
                        if (a+$scope.checkStus.length>maxData.data().maxMembers) {
                            console.log("超過上限");
                            // 刪回剛剛加的人
                            $scope.checkStus.splice($scope.checkStus.indexOf(Stu),1);
                            // 不讓此項打勾
                            var index = $.map($scope.Stus, function(item, index) {
                                return item.StuID;
                            }).indexOf(Stu);
                            $scope.Stus[index].Checked = false;
                        }
                        // 顯示已選數
                        $scope.maxMember = {now:a+$scope.checkStus.length,maxMember:maxData.data().maxMembers};
                        console.log($scope.checkStus);
                    };
                }).catch(function(error) { 
                    console.log("查詢組員上限發生錯誤：", error); 
                });

                // 判斷是跳出邀請泡泡還是創立泡泡
                if (InviteOrAdd == "invite") {
                    // 邀請小組 - 跳出泡泡
                    $ionicPopup.show({
                        title: '選擇組員',
                        subTitle: '邀請後需等待對方同意加入才會加入。',
                        template: 
                            '<div ng-model="maxMember">組員人數限制：{{maxMember.now}}/{{maxMember.maxMember}}</div>'+
                            '<div ng-repeat="Stu in Stus">'+
                            '<ion-checkbox ng-model="Stu.Checked" ng-click="check(Stu.StuID)">{{Stu.StuID}} {{Stu.Name}}</ion-checkbox>'+
                            '</div>',
                        scope: $scope,
                        buttons: [{
                            text: '取消',
                            type: 'button-default',
                            onTap: function(e) {
                                console.log('選擇取消');
                            }
                        }, {
                            text: '邀請',
                            type: 'button-chanry1',
                            onTap: function(e) {
                                console.log('選擇邀請');
                                // 判斷是否沒勾
                                if ($scope.checkStus.length == 0) {
                                    console.log("請勾選成員");
                                    var alertPopup = $ionicPopup.alert({
                                        title: '錯誤',
                                        template: '請選擇至少一名成員。'
                                    });
                                } else {
                                    // 邀請小組 - 更新小組邀請名單
                                    db.collection("分組").doc(ClassID).collection("group").doc(NowGroupID)
                                    .update({
                                        inviting: $scope.checkStus
                                    })
                                    .then(function() {
                                        console.log("更新小組邀請名單成功");
                                        // 邀請小組 - 傳送邀請通知
                                        for (let index = 0; index < $scope.checkStus.length; index++) {
                                            db.collection("分組").doc(ClassID).collection("student").doc($scope.checkStus[index]).collection("invite")
                                            .add({
                                                leader: StuID,
                                                groupID: NowGroupID,
                                                respond: false
                                            })
                                            .then(function() {
                                                console.log("傳送邀請通知成功");
                                            })
                                            .catch(function(error) {
                                                console.error("傳送邀請通知失敗：", error);
                                            });
                                        }
                                        
                                    })
                                    .catch(function(error) {
                                        console.error("更新小組邀請名單失敗：", error);
                                    });
                                }
                            }
                        }]
                    });
                } else {
                    // 創立小組 - 跳出泡泡
                    $ionicPopup.show({
                        title: '選擇組員',
                        subTitle: '創立後需等待對方同意加入才會加入。',
                        template: 
                            '<div ng-model="maxMember">組員人數限制：{{maxMember.now}}/{{maxMember.maxMember}}</div>'+
                            '<div ng-repeat="Stu in Stus">'+
                            '<ion-checkbox ng-model="Stu.Checked" ng-click="check(Stu.StuID)">{{Stu.StuID}} {{Stu.Name}}</ion-checkbox>'+
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
                            type: 'button-chanry1',
                            onTap: function(e) {
                                console.log('選擇創立');
                                // 判斷是否沒勾
                                if ($scope.checkStus.length == 0) {
                                    console.log("請勾選成員");
                                    var alertPopup = $ionicPopup.alert({
                                        title: '錯誤',
                                        template: '請選擇至少一名成員。'
                                    });
                                } else {
                                    // 創立小組 - 新增小組名單
                                    db.collection("分組").doc(ClassID).collection("group")
                                    .add({
                                        leader: StuID,
                                        members: [StuID],
                                        inviting: $scope.checkStus
                                    })
                                    .then(function(data) {
                                        var groupID = data.id;
                                        console.log("新增小組成功");
                                        // 創立小組 - 更新入組狀態
                                        db.collection("分組").doc(ClassID).collection("student").doc(StuID)
                                        .update({
                                            grouped: true
                                        })
                                        .then(function(data) {
                                            console.log("更新入組狀態成功");
                                            // 創立小組 - 傳送邀請通知
                                            for (let index = 0; index < $scope.checkStus.length; index++) {
                                                db.collection("分組").doc(ClassID).collection("student").doc($scope.checkStus[index]).collection("invite")
                                                .add({
                                                    leader: StuID,
                                                    groupID: groupID,
                                                    respond: false
                                                })
                                                .then(function(data) {
                                                    console.log("傳送邀請通知成功");
                                                })
                                                .catch(function(error) {
                                                    console.error("傳送邀請通知失敗：", error);
                                                });
                                            }
                                        })
                                        .catch(function(error) {
                                            console.error("更新入組狀態失敗：", error);
                                        });
                                    })
                                    .catch(function(error) {
                                        console.error("新增小組失敗：", error);
                                    });
                                }
                            }
                        }]
                    });
                }
            };

            // 解散小組 or 退出小組
            $scope.delGroup = function(DelOrQuit) {
                if (DelOrQuit == "del") {
                    // 解散小組 - 跳出泡泡
                    $ionicPopup.confirm({
                        title: '解散小組',
                        template: '確定要解散小組嗎?',
                        subTitle: '注意：解散後會刪除所有小組資料，包括討論紀錄、上傳作業、分組評分...等。',
                        buttons: [{
                            text: '取消',
                            type: 'button-default',
                            onTap: function(e) {
                                console.log('選擇取消');
                            }
                        }, {
                            text: '解散',
                            type: 'button-chanry1',
                            onTap: function(e) {
                                console.log('選擇解散');

                                // 解散小組 - 刪除小組資料+收回邀請通知
                                db.collection("分組").doc(ClassID).collection("group").where("leader", "==", StuID)
                                .get().then(function(results) {
                                    if(results.empty) {
                                        console.log("解散小組錯誤：非組長"); 
                                    } else {
                                        results.forEach(function (doc) {
                                            // 跑邀請清單(邀請清單內無人則不會跑)
                                            for (let index = 0; index < doc.data().inviting.length; index++) {
                                                db.collection("分組").doc(ClassID).collection("student").doc(doc.data().inviting[index]).collection("invite").where("groupID", "==", doc.id)
                                                .get().then(function(results) {
                                                    if(results.empty) {
                                                        console.log("收回邀請通知錯誤：無須收回之通知"); 
                                                    } else {
                                                        results.forEach(function (doc2) {
                                                            // 收回邀請通知
                                                            db.collection("分組").doc(ClassID).collection("student").doc(doc.data().inviting[index]).collection("invite").doc(doc2.id)
                                                            .update({
                                                                respond: true
                                                            })
                                                            .then(function(data) {
                                                                console.log("收回邀請通知成功");
                                                            })
                                                            .catch(function(error) {
                                                                console.error("收回邀請通知失敗：", error);
                                                            });
                                                        });
                                                    }
                                                }).catch(function(error) { 
                                                    console.log("收回邀請通知錯誤：", error); 
                                                });
                                            }
                                            // 跑組員清單(組員清單內無人則不會跑)
                                            for (let index = 0; index < doc.data().members.length; index++) {
                                                // 更新入組狀態
                                                db.collection("分組").doc(ClassID).collection("student").doc(doc.data().members[index])
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
                                            // 刪除小組資料
                                            db.collection("分組").doc(ClassID).collection("group").doc(doc.id)
                                            .delete()
                                            .then(function(data) {
                                                console.log("解散小組成功");
                                                $scope.members = [];
                                                $state.go($state.current, {}, {reload: true}); //重新載入view
                                            })
                                            .catch(function(error) {
                                                console.error("解散小組失敗：", error);
                                            });
                                            
                                        });
                                    }
                                }).catch(function(error) { 
                                    console.log("解散小組錯誤：", error); 
                                });
                            }
                        }]
                    });
                } else if(DelOrQuit == "quit") {
                    // 退出小組 - 跳出泡泡
                    $ionicPopup.confirm({
                        title: '退出小組',
                        template: '確定要退出小組嗎?',
                        buttons: [{
                            text: '取消',
                            type: 'button-default',
                            onTap: function(e) {
                                console.log('選擇取消');
                            }
                        }, {
                            text: '退出',
                            type: 'button-chanry1',
                            onTap: function(e) {
                                console.log('選擇解散');
                                // 退出小組 - 刪除小組members資料
                                db.collection("分組").doc(ClassID).collection("group").where("members", "array-contains", StuID)
                                .get().then(function (querySnapshot) {
                                    querySnapshot.forEach(function (doc) {
                                        var groupID = doc.id;
                                        var members = doc.data().members;
                                        // 刪除自己
                                        members.splice(members.indexOf(StuID),1);
                                        // 更新members資料
                                        db.collection("分組").doc(ClassID).collection("group").doc(groupID)
                                        .update({
                                            members: members
                                        })
                                        .then(function(data) {
                                            console.log("更新members資料成功");
                                        })
                                        .catch(function(error) {
                                            console.error("更新members資料失敗：", error);
                                        });
                                    });
                                });
                                // 更新入組狀態
                                db.collection("分組").doc(ClassID).collection("student").doc(StuID)
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
                }
                
            };

        }else{
            console.log("尚未登入");
            $state.go("login");
        }
    });
}])

// ----------------------------------------投票系統頁面----------------------------------------
.controller('voteCtrl', ['$scope', '$stateParams', 
function ($scope, $stateParams) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@"));
            var ClassID = localStorage.getItem("ClassID");

            // ...
        }else{
            console.log("尚未登入");
            $state.go("login");
        }
    });
}])
   
// ----------------------------------------課程任務頁面----------------------------------------
.controller('missionCtrl', ['$scope', '$stateParams', 
function ($scope, $stateParams) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@"));
            var ClassID = localStorage.getItem("ClassID");

            // ...
        }else{
            console.log("尚未登入");
            $state.go("login");
        }
    });
}])

// ----------------------------------------腦力激盪頁面----------------------------------------
.controller('brainstormingCtrl', ['$scope', '$stateParams', '$state', '$ionicScrollDelegate', '$ionicLoading', '$ionicPopup',
function ($scope, $stateParams, $state, $ionicScrollDelegate, $ionicLoading, $ionicPopup) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@"));
            var StuName = localStorage.getItem("StuName");
            var ClassID = localStorage.getItem("ClassID");
            var GroupID = localStorage.getItem("GroupID");

            // 預設在頁籤1
            $scope.search = 'fkozq65K頁籤：'+1;
            // 頁籤控制
            $scope.tabs = function(number) {
                if (number=='+') {
                    // 不給新增超過10頁
                    if ($scope.tabsCounts.length>=10) {
                        $ionicPopup.confirm({
                            title: '新增分頁',
                            template: '分頁已到上限(10頁)。',
                            buttons: [{
                                text: '好的',
                                type: 'button-chanry1',
                                onTap: function(e) {
                                }
                            }]
                        });
                    } else {
                        $ionicPopup.confirm({
                            title: '新增分頁',
                            template: '確定要新增嗎?',
                            subTitle: '注意：新增後無法刪除，上限為10個分頁。',
                            buttons: [{
                                text: '取消',
                                type: 'button-default',
                                onTap: function(e) {
                                    console.log('選擇取消');
                                }
                            }, {
                                text: '確定',
                                type: 'button-chanry1',
                                onTap: function(e) {
                                    console.log('選擇新增');
                                    // 新增分頁
                                    db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc("頁籤")
                                    .update({
                                        count: $scope.tabsCounts.length+1
                                    })
                                    .then(function() {
                                        console.log("新增分頁成功");
                                        $state.go($state.current, {}, {reload: true}); //重新載入view
                                    })
                                    .catch(function(error) {
                                        console.error("新增分頁失敗", error);
                                    });
                                }
                            }]
                        });
                    }
                    
                } else {
                    // 設定filters
                    $scope.search = 'fkozq65K頁籤：'+number;
                    // 用findIndex找出要刪除的位置
                    var indexNum = $scope.tabsCounts.findIndex((element)=>{
                        return (element.active === true);
                    });
                    $scope.tabsCounts.splice(indexNum,1,{num:indexNum+1,active:false});
                    // 替換class
                    $scope.tabsCounts.splice(number-1,1,{num:number,active:true});
                }
            }
            // 監聽 - 頁籤數
            db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc("頁籤")
            .onSnapshot(function(doc) {
                if (doc.exists) {
                    $scope.tabsCounts = [];
                    for (let index = 1; index <= doc.data().count; index++) {
                        if (index==1) {
                            $scope.tabsCounts.push({num:index,active:true});
                        } else {
                            $scope.tabsCounts.push({num:index,active:false});
                        }
                    }
                    $state.go($state.current, {}, {reload: true}); //重新載入view
                } else {
                    // 初始化分頁
                    db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc("頁籤")
                    .set({
                        count: 3
                    })
                    .then(function() {
                        console.log("初始化分頁成功");
                    })
                    .catch(function(error) {
                        console.error("初始化分頁失敗", error);
                    });
                }
            });

            $scope.items = [];
            // 監聽 - 腦力激盪內容
            db.collection("腦力激盪").doc(ClassID).collection(GroupID).orderBy("time","asc")
            .onSnapshot({
                includeMetadataChanges: true
            }, function(querySnapshot) {
                querySnapshot.docChanges().forEach(function(change) {
                    if (change.type === "added") {
                        // 判斷有無按過讚
                        var a = change.doc.data();
                        a.ID = change.doc.id;
                        if (a.like.indexOf(StuID)!=-1) {
                            a.likeBtn = true;
                        } else {
                            a.likeBtn = false;  
                        }
                        $scope.items.push(a);
                        $scope.$apply(); //重新監聽view
                        $ionicScrollDelegate.scrollBottom(true); //滑到最下面
                        console.log("新增: ", a);
                    }
                    if (change.type === "modified") {
                        // 判斷有無按過讚
                        var a = change.doc.data();
                        a.ID = change.doc.id;
                        if (a.like.indexOf(StuID)!=-1) {
                            a.likeBtn = true;
                        } else {
                            a.likeBtn = false;  
                        }
                        // 用findIndex找出要刪除的位置
                        var indexNum = $scope.items.findIndex((element)=>{
                            return (element.time.seconds === change.doc.data().time.seconds) & (element.time.nanoseconds === change.doc.data().time.nanoseconds);
                        });
                        if (indexNum!=-1) {
                            // 刪掉舊的 並插入新的
                            $scope.items.splice(indexNum,1,a);
                            console.log("修改列表成功");
                        }else{
                            console.log("修改列表不成功");
                        }
                        $scope.$apply(); //重新監聽view
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
                        $scope.$apply(); //重新監聽view
                    }
                });
            });
            
            // 新增腦力激盪
            $scope.add = function() {
                $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>新增中...</p>'});
                if ($scope.input!=undefined && $scope.input!="") {
                    db.collection("腦力激盪").doc(ClassID).collection(GroupID)
                    .add({
                        StuID: StuID,
                        StuName: StuName,
                        msg: $scope.input,
                        like: [],
                        invited: false,
                        search: $scope.search,
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
                var query = db.collection("腦力激盪").doc(ClassID).collection(GroupID).where("time", "==", item.time);
                query.get().then(function (querySnapshot) {
                    querySnapshot.forEach(function (doc) {
                        db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(doc.id)
                        .delete().then(function () {
                            console.log("刪除腦力激盪成功");
                        }).catch(function(error) {
                            console.error("刪除腦力激盪失敗：", error);
                        });
                    });
                });
                $ionicLoading.hide();
            };

            // 按讚
            $scope.like = function(item) {
                if (item.likeBtn == true) {
                    // 更新按讚狀態
                    item.like.splice(item.like.indexOf(StuID),1);
                    db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(item.ID)
                    .update({
                        like: item.like
                    })
                    .then(function(data) {
                        console.log("更新按讚狀態成功");
                    })
                    .catch(function(error) {
                        console.error("更新按讚狀態失敗：", error);
                    });
                } else {
                    // 更新按讚狀態
                    item.like.push(StuID);
                    db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(item.ID)
                    .update({
                        like: item.like
                    })
                    .then(function(data) {
                        console.log("更新按讚狀態成功");
                    })
                    .catch(function(error) {
                        console.error("更新按讚狀態失敗：", error);
                    });
                }
            };

            // 判斷組長
            db.collection("分組").doc(ClassID).collection("group").where("leader", "==", StuID)
            .get().then(function(results) {
                if(results.empty) {
                    console.log("你非組長"); 
                    $scope.DelAllBtnShow = false;
                } else {
                    console.log("你是組長");
                    $scope.DelAllBtnShow = true;
                }
            }).catch(function(error) { 
                console.log("判斷組長發生錯誤：", error); 
            });

            // 清空按鈕
            $scope.DelAllBtn = function() {
                $ionicPopup.confirm({
                    title: '清空腦力激盪資料',
                    template: '確定要清空嗎?',
                    subTitle: '注意：清空會刪除全體組員腦力激盪資料。',
                    buttons: [{
                        text: '取消',
                        type: 'button-default',
                        onTap: function(e) {
                            console.log('選擇取消');
                        }
                    }, {
                        text: '確定',
                        type: 'button-chanry1',
                        onTap: function(e) {
                            console.log('選擇清空');
                            // 取得全部訊息
                            db.collection("腦力激盪").doc(ClassID).collection(GroupID)
                            .get().then(function(results) {
                                results.forEach(function (doc) {
                                    db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(doc.id)
                                    .delete().then(function () {
                                        console.log("刪除腦力激盪成功");
                                    }).catch(function(error) {
                                        console.error("刪除腦力激盪失敗：", error);
                                    });
                                });
                            }).catch(function(error) { 
                                console.log("查詢全部訊息發生錯誤：", error); 
                            });
                        }
                    }]
                });
            };

        }else{
            console.log("尚未登入");
            $state.go("login");
        }
    });
}])

// ----------------------------------------提案聚焦頁面----------------------------------------
.controller('proposalCtrl', ['$scope', '$stateParams', '$state', '$ionicPopup', '$ionicLoading', '$ionicScrollDelegate',
function ($scope, $stateParams, $state, $ionicPopup, $ionicLoading, $ionicScrollDelegate) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@"));
            var StuName = localStorage.getItem("StuName");
            var ClassID = localStorage.getItem("ClassID");
            var GroupID = localStorage.getItem("GroupID");
            
            // 判斷組長
            db.collection("分組").doc(ClassID).collection("group").where("leader", "==", StuID)
            .get().then(function(results) {
                if(results.empty) {
                    console.log("你非組長"); 
                    $scope.leaderGroupShow = false;
                } else {
                    console.log("你是組長");
                    $scope.leaderGroupShow = true;
                }
            }).catch(function(error) { 
                console.log("判斷組長發生錯誤：", error); 
            });

            $scope.items = [];
            // 監聽 - 提案聚焦內容
            db.collection("提案聚焦").doc(ClassID).collection(GroupID).orderBy("time","asc")
            .onSnapshot({
                includeMetadataChanges: true
            }, function(querySnapshot) {
                querySnapshot.docChanges().forEach(function(change) {
                    if (change.type === "added") {
                        var a = change.doc.data();
                        var b = [];
                        // 找出腦力激盪內容
                        a.brainstorming.forEach(function(brainstormingID) {
                            db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(brainstormingID)
                            .get().then(function(results) {
                                b.push(results.data());
                                $scope.$apply(); //重新監聽view
                            }).catch(function(error) { 
                                console.log("腦力激盪內容發生錯誤：", error); 
                            });
                        });
                        $scope.items.push({ProposalName:a.ProposalName,brainstorming:b,time:a.time});
                        $ionicScrollDelegate.scrollBottom(true); //滑到最下面
                        console.log("新增: ", $scope.items);
                    }
                    if (change.type === "modified") {
                        console.log("修改: ", change.doc.data());
                        var a = change.doc.data();
                        var b = [];
                        // 找出腦力激盪內容
                        a.brainstorming.forEach(function(brainstormingID) {
                            db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(brainstormingID)
                            .get().then(function(results) {
                                b.push(results.data());
                                $scope.$apply(); //重新監聽view
                            }).catch(function(error) { 
                                console.log("腦力激盪內容發生錯誤：", error); 
                            });
                        });
                        // 用findIndex找出要修改的位置
                        var indexNum = $scope.items.findIndex((element)=>{
                            return (element.time.seconds === change.doc.data().time.seconds) & (element.time.nanoseconds === change.doc.data().time.nanoseconds);
                        });
                        // 修改
                        $scope.items[indexNum].brainstorming = b;
                        $scope.$apply(); //重新監聽view
                    }
                    if (change.type === "removed") {
                        console.log("刪除: ", change.doc.data());
                        // 用findIndex找出要刪除的位置
                        var indexNum = $scope.items.findIndex((element)=>{
                            return (element.time.seconds === change.doc.data().time.seconds) & (element.time.nanoseconds === change.doc.data().time.nanoseconds);
                        });
                        // 刪除
                        if (indexNum!=-1) {
                            $scope.items.splice(indexNum,1);
                            console.log("刪除列表成功");
                        }else{
                            console.log("刪除列表不成功");
                        }
                        $scope.$apply(); //重新監聽view
                    }
                });
            });

            // 新增提案
            $scope.AddProposal = function(InviteOrAdd,time) {
                $scope.proposals = [];
                // 新增提案 - 取得未新增名單
                $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>載入腦力激盪中...</p>'});
                db.collection("腦力激盪").doc(ClassID).collection(GroupID).where("invited", "==", false)
                .get().then(function(results) {
                    if(results.empty) {
                        console.log("全都已新增or無腦力激盪");
                        $ionicLoading.hide();
                    } else {
                        var a = results.docs.length;
                        var count = 0;
                        results.forEach(function (doc) {
                            $scope.proposals.push({ID:doc.id,msg:doc.data().msg,like:doc.data().like.length,search:Number(doc.data().search.substr(11))});
                            // 判斷最後一筆關閉轉圈圈
                            count++;
                            if (count==a) {
                                $ionicLoading.hide();
                            }
                        });
                        console.log("取得未分組名單：",$scope.proposals);
                    }
                }).catch(function(error) { 
                    console.log("取得未分組名單發生錯誤：", error); 
                });

                // 分類器 依分頁分類
                var indexedsearch = [];
                $scope.proposalsForFilter = function() {
                    indexedsearch = [];
                    return $scope.proposals;
                };
                $scope.searchFilter = function(proposals) {
                    var newsearch = indexedsearch.indexOf(proposals.search) == -1;
                    if(newsearch) {
                      indexedsearch.push(proposals.search);     
                    }
                    return newsearch;
                };

                $scope.checkProposals = [];
                // 新增提案 - 偵測勾選
                $scope.proposalBtn = function(proposalID) {
                    // 判斷有無在陣列中，無則增加、有則刪除
                    if ($scope.checkProposals.indexOf(proposalID) === -1) {
                        $scope.checkProposals.push(proposalID);
                    } else {
                        $scope.checkProposals.splice($scope.checkProposals.indexOf(proposalID),1);
                    }
                    console.log($scope.checkProposals);
                };
                
                $scope.proposalInput = [];
                // 判斷新增還是加入提案
                if (InviteOrAdd=="Add") {
                    // 新增提案 - 跳出泡泡
                    $ionicPopup.show({
                        title: '新增提案',
                        subTitle: '請選擇加入提案之腦力激盪。',
                        template: 
                            '<input type="text" ng-model="proposalInput.content" placeholder="輸入提案標題（限15字內）..." maxlength="15" style="margin-bottom:10px; padding:8px;">'+
                            '<div ng-repeat="proposalsPerSearch in proposalsForFilter() | filter:searchFilter | orderBy:'+"'search'"+'">'+
                                '<div class="item item-divider">腦力激盪{{proposalsPerSearch.search}}</div>'+
                                '<div ng-repeat="proposal in proposals | filter:{search:proposalsPerSearch.search} | orderBy:'+"'-like'"+' ">'+
                                    '<ion-checkbox ng-click="proposalBtn(proposal.ID)">{{proposal.like}}票：{{proposal.msg}}</ion-checkbox>'+
                                '</div>'+
                            '</div>',
                        scope: $scope,
                        buttons: [{
                            text: '取消',
                            type: 'button-default',
                            onTap: function(e) {
                                console.log('選擇取消');
                            }
                        }, {
                            text: '新增',
                            type: 'button-chanry1',
                            onTap: function(e) {
                                console.log('選擇新增');
                                // 判斷是否必填未填
                                if ($scope.proposalInput.content==""||$scope.proposalInput.content==undefined) {
                                    console.log("請填寫提案標題");
                                    $ionicPopup.alert({
                                        title: '錯誤',
                                        template: '請填寫提案標題。'
                                    });
                                } else if($scope.checkProposals.length == 0) {
                                    console.log("請勾選腦力激盪");
                                    $ionicPopup.alert({
                                        title: '錯誤',
                                        template: '請勾選至少一項腦力激盪。'
                                    });
                                } else {
                                    // 新增提案
                                    db.collection("提案聚焦").doc(ClassID).collection(GroupID)
                                    .add({
                                        ProposalName: $scope.proposalInput.content,
                                        brainstorming: $scope.checkProposals,
                                        time: new Date()
                                    })
                                    .then(function(data) {
                                        console.log("新增提案成功");
                                        // 標記提案已加入
                                        $scope.checkProposals.forEach(function (brainstormingID) {
                                            db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(brainstormingID)
                                            .update({
                                                invited: true
                                            })
                                            .then(function(data) {
                                                console.log("標記提案成功");
                                            })
                                            .catch(function(error) {
                                                console.error("標記提案失敗：", error);
                                            });
                                        });
                                    })
                                    .catch(function(error) {
                                        console.error("新增提案失敗：", error);
                                    });
                                }
                            }
                        }]
                    });
                } else if (InviteOrAdd=="Invite") {
                    // 加入提案 - 跳出泡泡
                    $ionicPopup.show({
                        title: '加入腦力激盪',
                        subTitle: '請選擇加入此提案之腦力激盪。',
                        template: 
                        '<div ng-repeat="proposalsPerSearch in proposalsForFilter() | filter:searchFilter | orderBy:'+"'search'"+' ">'+
                            '<div class="item item-divider">腦力激盪{{proposalsPerSearch.search}}</div>'+
                            '<div ng-repeat="proposal in proposals | filter:{search:proposalsPerSearch.search} | orderBy:'+"'like'"+' ">'+
                                '<ion-checkbox ng-click="proposalBtn(proposal.ID)">{{proposal.msg}}</ion-checkbox>'+
                            '</div>'+
                        '</div>',
                        scope: $scope,
                        buttons: [{
                            text: '取消',
                            type: 'button-default',
                            onTap: function(e) {
                                console.log('選擇取消');
                            }
                        }, {
                            text: '加入',
                            type: 'button-chanry1',
                            onTap: function(e) {
                                console.log('選擇加入');
                                // 判斷是否必填未填
                                if($scope.checkProposals.length == 0) {
                                    console.log("請勾選腦力激盪");
                                    $ionicPopup.alert({
                                        title: '錯誤',
                                        template: '請勾選至少一項腦力激盪。'
                                    });
                                } else {
                                    // 取得提案ID
                                    db.collection("提案聚焦").doc(ClassID).collection(GroupID).where("time", "==", time)
                                    .get().then(function(results) {
                                        results.forEach(function (doc) {
                                            var proposalID = doc.id;
                                            // 取得提案聚焦內腦力激盪陣列
                                            db.collection("提案聚焦").doc(ClassID).collection(GroupID).doc(proposalID)
                                            .get().then(function(doc) {
                                                // 更新提案
                                                db.collection("提案聚焦").doc(ClassID).collection(GroupID).doc(proposalID)
                                                .update({
                                                    brainstorming: doc.data().brainstorming.concat($scope.checkProposals)
                                                })
                                                .then(function(data) {
                                                    console.log("更新提案成功");
                                                    // 標記提案已加入
                                                    $scope.checkProposals.forEach(function (brainstormingID) {
                                                        db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(brainstormingID)
                                                        .update({
                                                            invited: true
                                                        })
                                                        .then(function(data) {
                                                            console.log("標記提案成功");
                                                        })
                                                        .catch(function(error) {
                                                            console.error("標記提案失敗：", error);
                                                        });
                                                    });
                                                })
                                                .catch(function(error) {
                                                    console.error("更新提案失敗：", error);
                                                });
                                            }).catch(function(error) { 
                                                console.log("取得提案聚焦內腦力激盪陣列發生錯誤：", error); 
                                            });
                                        });
                                    }).catch(function(error) { 
                                        console.log("查詢全部訊息發生錯誤：", error); 
                                    });
                                }
                            }
                        }]
                    });
                }
            };

            // 刪除提案
            $scope.DelProposal = function(time) {
                $ionicPopup.confirm({
                    title: '刪除提案',
                    template: '確定要刪除此提案嗎?',
                    buttons: [{
                        text: '取消',
                        type: 'button-default',
                        onTap: function(e) {
                            console.log('選擇取消');
                        }
                    }, {
                        text: '確定',
                        type: 'button-chanry1',
                        onTap: function(e) {
                            console.log('選擇刪除');
                            // 取得提案ID
                            db.collection("提案聚焦").doc(ClassID).collection(GroupID).where("time", "==", time)
                            .get().then(function(results) {
                                results.forEach(function (doc) {
                                    db.collection("提案聚焦").doc(ClassID).collection(GroupID).doc(doc.id)
                                    .delete().then(function () {
                                        console.log("刪除提案聚焦成功");
                                        // 標記提案未加入
                                        doc.data().brainstorming.forEach(function (brainstormingID) {
                                            db.collection("腦力激盪").doc(ClassID).collection(GroupID).doc(brainstormingID)
                                            .update({
                                                invited: false
                                            })
                                            .then(function(data) {
                                                console.log("標記提案成功");
                                            })
                                            .catch(function(error) {
                                                console.error("標記提案失敗：", error);
                                            });
                                        });
                                    }).catch(function(error) {
                                        console.error("刪除提案聚焦失敗：", error);
                                    });
                                });
                            }).catch(function(error) { 
                                console.log("查詢全部訊息發生錯誤：", error); 
                            });
                        }
                    }]
                });
            };

        }else{
            console.log("尚未登入");
            $state.go("login");
        }
    });
}])

// ----------------------------------------評分頁面----------------------------------------
.controller('scoreCtrl', ['$scope', '$stateParams', 
function ($scope, $stateParams) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@"));
            var ClassID = localStorage.getItem("ClassID");

            // ...
        }else{
            console.log("尚未登入");
            $state.go("login");
        }
    });
}])

// ----------------------------------------組內互評頁面----------------------------------------
.controller('ingroup_mutualCtrl', ['$scope', '$stateParams', 
function ($scope, $stateParams) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@"));
            var ClassID = localStorage.getItem("ClassID");

            // ...
        }else{
            console.log("尚未登入");
            $state.go("login");
        }
    });
}])

// ----------------------------------------設定頁面----------------------------------------
.controller('settingCtrl', ['$scope', '$stateParams', '$ionicLoading', '$ionicPopup',
function ($scope, $stateParams, $ionicLoading, $ionicPopup) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@"));
            var ClassID = localStorage.getItem("ClassID");
            
            // 上傳大頭照功能
            var SaveBtn2 = document.getElementById("page7_savebtn2");    
            var uploadFileInput2 = document.getElementById("uploadFileInput2");
            SaveBtn2.addEventListener("click",function(){
                $ionicLoading.show({ // 開始跑圈圈
                    template: '上傳圖片中...'
                });
                var file = uploadFileInput2.files[0];
                // 判斷是否有上傳
                if (file == undefined) {
                    console.log("未選擇檔案");
                    $ionicLoading.hide();
                    var alertPopup = $ionicPopup.alert({
                        title: '未選擇檔案',
                        template: '請先選擇檔案再上傳'
                    });
                } else {
                    var storage = firebase.storage();
                    var storageRef = storage.ref();
                    var now = new Date();
                    var ImgID = now.getFullYear().toString()+now.getMonth()+now.getDate()+now.getHours()+now.getMinutes()+now.getSeconds()+now.getMilliseconds();
                    var uploadTask = storageRef.child('members/'+ImgID).put(file);
                    uploadTask.on('state_changed', function(snapshot){
                        // 取得檔案上傳狀態，並用數字顯示
                        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        $ionicLoading.show({ // 開始跑圈圈
                            template: '已上傳 ' + progress + '%'
                        });
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
                        // 更新menu的大頭照
                        storageRef.child('members/'+ImgID).getDownloadURL().then(function(url) {
                            document.getElementById("menu-img").src=url;
                        })
                        // 更新DB檔名
                        db.collection("帳號").doc(StuID)
                        .update({
                            Img: ImgID
                        })
                        .then(function(data) {
                            console.log("更新DB檔名成功");
                        })
                        .catch(function(error) {
                            console.error("更新DB檔名失敗：", error);
                        });

                        var alertPopup = $ionicPopup.alert({
                            title: '成功',
                            template: '更換照片完成。'
                        });
                    });
                }
                
            },false);

        }else{
            console.log("尚未登入");
            $state.go("login");
        }
    });
}])

// ----------------------------------------選單頁面----------------------------------------
.controller('menuCtrl', ['$scope', '$stateParams', '$ionicPopup', '$state',
function ($scope, $stateParams, $ionicPopup, $state) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@"));
            var ClassID = localStorage.getItem("ClassID");

            // 查詢姓名
            db.collection("帳號").doc(StuID)
            .get().then(function(results) {
                // 更新使用者姓名
                document.getElementById("menu-heading1").innerText = StuID + ' ' +results.data().Name;
                localStorage.setItem("StuName",results.data().Name);
            }).catch(function(error) { 
                console.log("查詢姓名發生錯誤：", error); 
            });

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
            
            // 查詢圖片檔名
            db.collection("帳號").doc(StuID)
            .get().then(function(results) {
                // 更新menu的大頭照
                console.log("更新大頭照成功");
                var storage = firebase.storage();
                var storageRef = storage.ref();
                storageRef.child('members/'+results.data().Img).getDownloadURL().then(function(url) {
                    document.getElementById("menu-img").src=url;
                })
            }).catch(function(error) { 
                console.log("查詢圖片檔名發生錯誤：", error); 
            });
              
            // 設定授權文字
            document.getElementById("menu-heading2").innerText="Copyright © 2019 ver "+verson;

            // 監聽 - 搜尋是否有人邀請
            db.collection("分組").doc(ClassID).collection("student").doc(StuID).collection("invite").where("respond", "==", false)
            .onSnapshot(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                    console.log("有人邀請");
                    // 查詢姓名
                    var groupID = doc.data().groupID;
                    var inviteID = doc.id;
                    var leaderID = doc.data().leader;
                    db.collection("帳號").doc(leaderID)
                    .get().then(function(results) {
                        var leaderName = results.data().Name;
                        //跳出邀請訊息
                        $ionicPopup.show({
                            title: '小組邀請',
                            subTitle: leaderID+' '+leaderName+' 邀請你加入小組。',
                            template: 
                                '<img class="inviteImg" src="img/invite.jpg">',
                            scope: $scope,
                            buttons: [{
                                text: '拒絕',
                                type: 'button-default',
                                onTap: function(e) {
                                    console.log('選擇拒絕');
                                    // 更新回應狀態
                                    db.collection("分組").doc(ClassID).collection("student").doc(StuID).collection("invite").doc(inviteID)
                                    .update({
                                        respond: true
                                    })
                                    .then(function(data) {
                                        console.log("更新回應狀態成功");
                                        // 檢查小組是否還存在 如存在 刪除自己邀請中狀態
                                        db.collection("分組").doc(ClassID).collection("group").doc(groupID)
                                        .get().then(function(results) {
                                            var inviting = results.data().inviting;
                                            // 刪除自己
                                            inviting.splice(inviting.indexOf(StuID),1);
                                            // 取消邀請
                                            db.collection("分組").doc(ClassID).collection("group").doc(groupID)
                                            .update({
                                                inviting: inviting
                                            })
                                            .then(function(data) {
                                                console.log("更新inviting成功");
                                            })
                                            .catch(function(error) {
                                                console.error("更新inviting失敗：", error);
                                            });
                                        }).catch(function(error) { 
                                            console.log("檢查小組是否還存在，可能小組已解散：", error); 
                                        });
                                    })
                                    .catch(function(error) {
                                        console.error("更新回應狀態失敗：", error);
                                    });
                                }
                            }, {
                                text: '接受',
                                type: 'button-chanry1',
                                onTap: function(e) {
                                    console.log('選擇接受');
                                    // 更新回應狀態
                                    db.collection("分組").doc(ClassID).collection("student").doc(StuID).collection("invite").doc(inviteID)
                                    .update({
                                        respond: true
                                    })
                                    .then(function(data) {
                                        console.log("更新回應狀態成功");
                                        // 創立小組 - 更新入組狀態
                                        db.collection("分組").doc(ClassID).collection("student").doc(StuID)
                                        .update({
                                            grouped: true
                                        })
                                        .then(function(data) {
                                            console.log("更新入組狀態成功");
                                            // 檢查小組是否還存在 如存在 刪除自己邀請中狀態
                                            db.collection("分組").doc(ClassID).collection("group").doc(groupID)
                                            .get().then(function(results) {
                                                var inviting = results.data().inviting;
                                                var members = results.data().members;
                                                // 刪除自己
                                                inviting.splice(inviting.indexOf(StuID),1);
                                                // 新增自己
                                                members.push(StuID);
                                                // 取消邀請
                                                db.collection("分組").doc(ClassID).collection("group").doc(groupID)
                                                .update({
                                                    inviting: inviting,
                                                    members: members
                                                })
                                                .then(function(data) {
                                                    console.log("更新inviting成功");
                                                })
                                                .catch(function(error) {
                                                    console.error("更新inviting失敗：", error);
                                                });
                                            }).catch(function(error) { 
                                                console.log("檢查小組是否還存在，可能小組已解散：", error); 
                                            });
                                        })
                                        .catch(function(error) {
                                            console.error("更新入組狀態失敗：", error);
                                        });
                                    })
                                    .catch(function(error) {
                                        console.error("更新回應狀態失敗：", error);
                                    });
                                }
                            }]
                        });
                    }).catch(function(error) { 
                        console.log("查詢姓名發生錯誤：", error); 
                    });
                });
            },function(error) {
                console.log("搜尋是否有人邀請發生錯誤：", error); 
            });

            // 監聽 - 是否有小組
            db.collection("分組").doc(ClassID).collection("group").where("members", "array-contains", StuID)
            .onSnapshot(function(results) {
                // 確認是否有小組
                if (results.empty == false) {
                    console.log("選單 - 已加入小組");
                    results.forEach(function (doc) {
                        // 設定小組ID
                        localStorage.setItem("GroupID",doc.id);
                        GroupID = doc.id;
                        // 開關顯示
                        $scope.needGroup = true;
                    });
                } else {
                    console.log("選單 - 未加入小組");
                    // 設定小組ID
                    localStorage.setItem("GroupID","none");
                    GroupID = "none";
                    // 開關顯示
                    $scope.needGroup = false;
                }
            },function(error) {
                console.log("取得小組ID發生錯誤：", error); 
            }); 
        }else{
            console.log("尚未登入");
            $state.go("login");
        }
    });
}])

// ----------------------------------------教師版主頁面----------------------------------------
.controller('root_pblCtrl', ['$scope', '$stateParams', '$ionicPopup', '$ionicLoading', '$state',
function ($scope, $stateParams, $ionicPopup, $ionicLoading, $state) {
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user.uid==="rTO1FDz95FaN59B9FtOqyntQZ4J3") { //登入成功，取得使用者
            console.log("已登入狀態");
            let originalUser = firebase.auth().currentUser;

            // 處理xlsx
            var persons = []; // 儲存獲取到的資料
            $('#excel-file').change(function(e) {
                var files = e.target.files;
                var fileReader = new FileReader();
                fileReader.onload = function(ev) {
                    try {
                        var data = ev.target.result;
                        var workbook = XLSX.read(data, {
                            type: 'binary'
                        }) // 以二進位制流方式讀取得到整份excel表格物件
                    } catch (e) {
                        console.log('檔案型別不正確');
                        return;
                    }
                    // 表格的表格範圍，可用於判斷表頭是否數量是否正確
                    var fromTo = '';
                    // 遍歷每張表讀取
                    for (var sheet in workbook.Sheets) {
                        if (workbook.Sheets.hasOwnProperty(sheet)) {
                            fromTo = workbook.Sheets[sheet]['!ref'];
                            console.log(fromTo);
                            persons = persons.concat(XLSX.utils.sheet_to_json(workbook.Sheets[sheet]));
                            // break; // 如果只取第一張表，就取消註釋這行
                        }
                    }
                    //在控制檯打印出來表格中的資料
                    console.log(persons);
                };
                // 以二進位制方式開啟檔案
                fileReader.readAsBinaryString(files[0]);
            });

            // 點擊創立
            var db = firebase.firestore();
            $scope.addClass = function() {
                var className = this.className;
                if (className===undefined || className==="" || persons.length===0) {
                    console.log("未填");
                    var alertPopup = $ionicPopup.alert({
                        title: '錯誤',
                        template: '資料未填完整。'
                    });
                } else {
                    var confirmPopup = $ionicPopup.confirm({
                        title: '創立課程',
                        template: '確定創立嗎?'
                    });
                    confirmPopup.then(function(res) {
                        if(res) {
                            console.log('確定');
                            $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>創立課程中...</p>'});
                            // 取得全部人學號
                            var Stu = [];
                            for (let index = 0; index < persons.length; index++) {
                                Stu.push(persons[index].學號);
                            }
                            // 創立課程 - 新增課程
                            db.collection("課程")
                            .add({
                                ClassName: className,
                                ClassContent: "暫無公告。",
                                inviteLock: false,
                                maxMembers: 6,
                                ClassStu: Stu
                            })
                            .then(function(data) {
                                console.log("新增課程成功");
                                // 創立課程 - 更新學生資料
                                var batch = db.batch();
                                batch.update(db.collection("課程").doc(data.id), {ClassID:data.id});
                                for (let index = 0; index < persons.length; index++) {
                                    db.collection("帳號").doc(persons[index].學號).get().then(function(doc) {
                                        // 如此判斷才不會覆蓋已新增的其他資料
                                        if (doc.exists) {
                                            // 已有帳號
                                            console.log("已有帳號");
                                            batch.set(db.collection("分組").doc(data.id).collection("student").doc(persons[index].學號), {grouped:false});
                                            // 判斷沒資料了 就送出
                                            if (index === persons.length-1) {
                                                batch.commit().then(function () {
                                                    console.log("更新學生成功");
                                                    persons = [];
                                                    $ionicLoading.hide();
                                                }).catch(function(error) {
                                                    console.error("更新學生資料失敗：", error);
                                                });
                                            }
                                        } else {
                                            // 尚無帳號
                                            console.log("尚無帳號");
                                            batch.set(db.collection("帳號").doc(persons[index].學號), {Name:persons[index].姓名}, {Img:"default"});
                                            batch.set(db.collection("分組").doc(data.id).collection("student").doc(persons[index].學號), {grouped:false});
                                            // 註冊Authentication
                                            firebase.auth().createUserWithEmailAndPassword(persons[index].學號+"@nkust.edu.tw", persons[index].學號)
                                            .then(() => {
                                                console.log("註冊Authentication成功");
                                                firebase.auth().updateCurrentUser(originalUser);
                                            })
                                            .catch((error) => {
                                                console.log("註冊Authentication失敗",error.message);
                                            });
                                            // 判斷沒資料了 就送出
                                            if (index === persons.length-1) {
                                                batch.commit().then(function () {
                                                    console.log("更新學生成功");
                                                    persons = [];
                                                    $ionicLoading.hide();
                                                }).catch(function(error) {
                                                    console.error("更新學生資料失敗：", error);
                                                });
                                            }
                                        }
                                    }).catch(function(error) {
                                        console.log("判斷帳號發生錯誤：", error); 
                                    });

                                    
                                }
                            })
                            .catch(function(error) {
                                console.error("新增課程失敗：", error);
                            });
                        } else {
                            console.log('取消');
                        }
                    });
                }
            }
           
            // 列出全部課程
            db.collection("課程")
            .get().then(function (querySnapshot) {
                $scope.AllClass = [];
                querySnapshot.forEach(function (doc) {
                    $scope.AllClass.push(doc.data());
                    $state.go($state.current, {}, {reload: true}); //重新載入view
                });
            });

            // 設定 - 開放學生自行分組
            $scope.LockGroupChange = function(ClassID,inviteLock) {
                // 更新inviteLock
                db.collection("課程").doc(ClassID)
                .update({
                    inviteLock: inviteLock
                })
                .then(function(data) {
                    console.log("更新inviteLock成功");
                })
                .catch(function(error) {
                    console.error("更新inviteLock失敗：", error);
                });
            };

            // 設定 - 小組人數上限
            $scope.maxMembersChange = function(ClassID,maxMembers) {
                // 更新maxMembers
                db.collection("課程").doc(ClassID)
                .update({
                    maxMembers: maxMembers
                })
                .then(function(data) {
                    console.log("更新maxMembers成功");
                })
                .catch(function(error) {
                    console.error("更新maxMembers失敗：", error);
                });
            };

        }else{
            console.log("非管理員");
            $state.go("login");
        }
    });
}])

// ----------------------------------------教師版分組狀態----------------------------------------
.controller('root_groupCtrl', ['$scope', '$stateParams', '$state', '$ionicLoading',
function ($scope, $stateParams, $state, $ionicLoading) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user.uid==="rTO1FDz95FaN59B9FtOqyntQZ4J3") { //登入成功，取得使用者
            console.log("已登入狀態");
            $scope.cardShow = false;
            
            // 列出全部課程
            db.collection("課程")
            .get().then(function (querySnapshot) {
                $scope.AllClass = [];
                querySnapshot.forEach(function (doc) {
                    $scope.AllClass.push(doc.data());
                    $state.go($state.current, {}, {reload: true}); //重新載入view
                });
            });

            // 按下課程
            $scope.choose_class = function(ClassID,ClassName) {
                $scope.cardShow = false;
                $ionicLoading.show({template:'<ion-spinner icon="lines" class="spinner-calm"></ion-spinner><p>載入資料中...</p>'});

                // 取得分組狀態
                $scope.Allgroups = [];
                // 未分組的人
                var Ngroup = [];
                db.collection("分組").doc(ClassID).collection("student").where("grouped", "==", false)
                .get().then(function (querySnapshot) {
                    querySnapshot.forEach(function (doc) {
                        // 查詢姓名
                        db.collection("帳號").doc(doc.id)
                        .get().then(function(results) {
                            Ngroup.push(doc.id+results.data().Name);
                        }).catch(function(error) { 
                            console.log("查詢姓名發生錯誤：", error); 
                        });
                    });
                    // 已分組的人
                    var Ygroup = [];
                    db.collection("分組").doc(ClassID).collection("student").where("grouped", "==", true)
                    .get().then(function (querySnapshot) {
                        querySnapshot.forEach(function (doc) {
                            Ygroup.push(doc.id);
                        });
                        $scope.Allgroups = [{ClassName:ClassName,Ngroup:Ngroup,Ygroup:Ygroup}];
                        // 繪製環形圖
                        var dom = document.getElementById("container");
                        var myChart = echarts.init(dom);
                        var app = {};
                        option = null;
                        app.title = '環形圖';
                        option = {
                            tooltip: {
                                trigger: 'item',
                                formatter: "{a} <br/>{b}: {c} ({d}%)"
                            },
                            legend: {
                                orient: 'vertical',
                                x: 'left',
                                data:['未分組','已分組']
                            },
                            series: [
                                {
                                    name:'分組狀態',
                                    type:'pie',
                                    radius: ['50%', '70%'],
                                    avoidLabelOverlap: false,
                                    label: {
                                        normal: {
                                            show: false,
                                            position: 'center'
                                        },
                                        emphasis: {
                                            show: true,
                                            textStyle: {
                                                fontSize: '15',
                                                fontWeight: 'bold'
                                            }
                                        }
                                    },
                                    labelLine: {
                                        normal: {
                                            show: false
                                        }
                                    },
                                    data:[
                                        {value:Ngroup.length, name:'未分組'},
                                        {value:Ygroup.length, name:'已分組'}
                                    ]
                                }
                            ]
                        };
                        if (option && typeof option === "object") {
                            myChart.setOption(option, true);
                        }

                        $scope.cardShow = true;
                        $ionicLoading.hide();
                        $state.go($state.current, {}, {reload: true}); //重新載入view
                    });
                });

                // 取得組別組員名單
                $scope.Allgroups2 = [];
                db.collection("分組").doc(ClassID).collection("group")
                .get().then(function (querySnapshot) {
                    querySnapshot.forEach(function (doc) {
                        var a = doc.data();
                        for (let index = 0; index < doc.data().members.length; index++) {
                            // 查詢姓名
                            db.collection("帳號").doc(doc.data().members[index])
                            .get().then(function(results) {
                                a.members[index] += results.data().Name;
                            }).catch(function(error) { 
                                console.log("查詢姓名發生錯誤：", error); 
                            });
                        }
                        $scope.Allgroups2.push(a);
                        $state.go($state.current, {}, {reload: true}); //重新載入view
                    });
                });

            };




        }else{
            console.log("尚未登入");
            $state.go("login");
        }
    });
}])

// ----------------------------------------教師版課程任務----------------------------------------
.controller('root_missionCtrl', ['$scope', '$stateParams', '$state', '$ionicPopup', '$sce',
function ($scope, $stateParams, $state, $ionicPopup, $sce) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user.uid==="rTO1FDz95FaN59B9FtOqyntQZ4J3") { //登入成功，取得使用者
            console.log("已登入狀態");
            $scope.cardShow = false;

            // 列出全部課程
            db.collection("課程")
            .get().then(function (querySnapshot) {
                $scope.AllClass = [];
                querySnapshot.forEach(function (doc) {
                    $scope.AllClass.push(doc.data());
                    $state.go($state.current, {}, {reload: true}); //重新載入view
                });
                console.log($scope.AllClass);
            });

            // 選擇課程 - 選擇中
            $scope.hide = function() {
                $scope.cardShow = false;
            };

            // 選擇課程 - 選擇完成
            $scope.SelectBtn = function(value) {
                if (value!=undefined) {
                    var ClassID = value.ClassID;
                    $scope.cardShow = true;
                    // 載入所有任務
                    $scope.missions = [];
                    db.collection("課程任務").doc(ClassID).collection("任務列表")
                    .get().then(function (querySnapshot) {
                        querySnapshot.forEach(function (doc) {
                            // $sce轉換格式為HTML
                            $scope.missions.push({Name:doc.data().Name,TimeOut:doc.data().TimeOut,LeaderOnly:doc.data().LeaderOnly,type:doc.data().type,finished:doc.data().finished,HTML:$sce.trustAsHtml(doc.data().HTML)});
                            $state.go($state.current, {}, {reload: true}); //重新載入view
                        });
                    });
                } else {
                    // 提醒
                    $ionicPopup.alert({
                        title: '錯誤',
                        template: '請選擇課程。'
                    });
                }
            };

            // 新增任務
            $scope.AddBtn = function(value) {
                $scope.AddBtnPopup = [];
                $scope.AddBtnPopup.LeaderOnly = false;
                var ClassID = value.ClassID;

                // 新增任務 - 跳出泡泡
                $ionicPopup.show({
                    title: '新增任務',
                    template: 
                        '<label class="item item-input item-input">'+
                            '<div class="input-label">任務名稱</div>'+
                            '<input type="text" ng-model="AddBtnPopup.Name" placeholder="輸入任務名稱（限15字內）..." maxlength="15">'+    
                        '</label>'+
                        
                        '<label class="item item-input item-select">'+
                            '<div class="input-label">任務類型</div>'+
                            '<select ng-model="AddBtnPopup.type">'+
                                '<option value="隨堂測驗">隨堂測驗</option>'+
                                '<option value="小組討論">小組討論</option>'+
                                '<option value="加分問卷">加分問卷</option>'+
                                '<option value="評分">評分</option>'+
                            '</select>'+
                        '</label>'+

                        '<label class="item item-input item-select">'+
                            '<div class="input-label">截止日期</div>'+
                            '<input type="date" ng-model="AddBtnPopup.TimeOut">'+    
                        '</label>'+

                        '<ion-toggle ng-model="AddBtnPopup.LeaderOnly">是否僅限組長執行</ion-toggle>'+

                        '<label class="item item-input item-input">'+
                            '<div class="input-label">HTML</div>'+
                            '<textarea cols="50" rows="5" ng-model="AddBtnPopup.HTML"></textarea>'+
                        '</label>',
                    scope: $scope,
                    buttons: [{
                        text: '取消',
                        type: 'button-default',
                        onTap: function(e) {
                            console.log('選擇取消');
                        }
                    }, {
                        text: '新增',
                        type: 'button-chanry1',
                        onTap: function(e) {
                            console.log('選擇新增');
                            // 判斷是否必填未填
                            if ($scope.AddBtnPopup.Name==undefined||$scope.AddBtnPopup.type==undefined||$scope.AddBtnPopup.TimeOut==undefined||$scope.AddBtnPopup.LeaderOnly==undefined||$scope.AddBtnPopup.HTML==undefined) {
                                console.log("請填寫完整");
                                $ionicPopup.alert({
                                    title: '錯誤',
                                    template: '請填寫完整。'
                                });
                            } else {
                                // 新增任務
                                db.collection("課程任務").doc(ClassID).collection("任務列表")
                                .add({
                                    Name: $scope.AddBtnPopup.Name,
                                    type: $scope.AddBtnPopup.type,
                                    TimeOut: $scope.AddBtnPopup.TimeOut,
                                    LeaderOnly: $scope.AddBtnPopup.LeaderOnly,
                                    HTML: $scope.AddBtnPopup.HTML,
                                    finished: []
                                })
                                .then(function(data) {
                                    console.log("新增任務成功");
                                })
                                .catch(function(error) {
                                    console.error("新增任務失敗：", error);
                                });
                            }
                        }
                    }]
                });
            };

        }else{
            console.log("尚未登入");
            $state.go("login");
        }
    });
}])

// ----------------------------------------教師版選單頁面----------------------------------------
.controller('rootmenuCtrl', ['$scope', '$stateParams', 
function ($scope, $stateParams) {
    var db = firebase.firestore();
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user) { //登入成功，取得使用者
            console.log("已登入狀態");
            var StuID = user.email.substring(0,user.email.indexOf("@"));
            var ClassID = localStorage.getItem("ClassID");

            // 查詢姓名
            db.collection("帳號").doc(StuID)
            .get().then(function(results) {
                // 更新使用者姓名
                document.getElementById("menu-heading1").innerText = StuID + ' ' +results.data().Name;
                localStorage.setItem("StuName",results.data().Name);
            }).catch(function(error) { 
                console.log("查詢姓名發生錯誤：", error); 
            });

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
            
            // 查詢圖片檔名
            db.collection("帳號").doc(StuID)
            .get().then(function(results) {
                // 更新menu的大頭照
                console.log("更新大頭照成功");
                var storage = firebase.storage();
                var storageRef = storage.ref();
                storageRef.child('members/'+results.data().Img).getDownloadURL().then(function(url) {
                    document.getElementById("menu-img").src=url;
                });
            }).catch(function(error) { 
                console.log("查詢圖片檔名發生錯誤：", error); 
            });
              
            // 設定授權文字
            document.getElementById("menu-heading2").innerText="Copyright © 2019 ver "+verson;
        }else{
            console.log("尚未登入");
            $state.go("login");
        }
    });
}]);

