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
            // 判斷教師版
            // if (StuID=="1031241104") {
            //     $state.go("rootmenu.root_pbl",{StuID:StuID});
            // } else {
                $state.go("choose_class",{StuID:StuID});
            // }
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
    $scope.choose_class = function(ClassID) {
        $timeout.cancel(mytimeout);//停止計時器
        localStorage.setItem("ClassID",ClassID);
        localStorage.setItem("StuID",$stateParams.StuID);
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
            // db.collection("帳號").doc(StuID).get().then(function(doc) {
            //     if (doc.exists) {
            //         console.log("成功取得使用者資料");
            //     } else {
            //         console.log("首次登入，建立使用者資料中...");
            //         db.collection("member").doc(StuID).set({
            //             暱稱: StuID,
            //             照片ID: "1321"
            //         })
            //         .then(function() {
            //             console.log("首次登入，建立使用者資料成功");
            //         })
            //         .catch(function(error) {
            //             console.error("首次登入，建立使用者資料失敗：", error);
            //             $state.go("login");
            //         });
            //     }
            // });

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
            db.collection("分組").doc(ClassID).collection("student").doc(StuID)
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
            db.collection("分組").doc(ClassID).collection("student").doc(StuID).collection("invite").where("respond", "==", false)
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
                                    $scope.Stus.push({StuID:doc.id,Name:results.data().Name});
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
                        '<ion-checkbox ng-click="check(Stu.StuID)">{{Stu.StuID}} {{Stu.Name}}</ion-checkbox>'+
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
                                    console.log("新增小組成功");
                                })
                                .catch(function(error) {
                                    console.error("新增小組失敗：", error);
                                });
                                // 創立小組 - 更新入組狀態
                                db.collection("分組").doc(ClassID).collection("student").doc(StuID)
                                .update({
                                    grouped: true
                                })
                                .then(function(data) {
                                    console.log("更新入組狀態成功");
                                })
                                .catch(function(error) {
                                    console.error("更新入組狀態失敗：", error);
                                });
                                // 創立小組 - 傳送邀請通知
                                for (let index = 0; index < $scope.checkStus.length; index++) {
                                    db.collection("分組").doc(ClassID).collection("student").doc($scope.checkStus[index]).collection("invite")
                                    .add({
                                        leader: StuID,
                                        respond: false
                                    })
                                    .then(function(data) {
                                        console.log("傳送邀請通知成功");
                                    })
                                    .catch(function(error) {
                                        console.error("傳送邀請通知失敗：", error);
                                    });
                                }
                            }
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

                            // 解散小組 - 刪除小組資料+收回邀請通知
                            db.collection("分組").doc(ClassID).collection("group").where("leader", "==", StuID)
                            .get().then(function(results) {
                                if(results.empty) {
                                    console.log("解散小組錯誤：非組長"); 
                                } else {
                                    results.forEach(function (doc) {
                                        // 刪除小組資料+收回邀請通知
                                        for (let index = 0; index < doc.data().inviting.length; index++) {
                                            db.collection("分組").doc(ClassID).collection("student").doc(doc.data().inviting[index]).collection("invite").where("leader", "==", StuID)
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
                                                            // 刪除小組資料
                                                            db.collection("分組").doc(ClassID).collection("group").doc(doc.id)
                                                            .delete()
                                                            .then(function(data) {
                                                                console.log("解散小組成功");
                                                            })
                                                            .catch(function(error) {
                                                                console.error("解散小組失敗：", error);
                                                            });
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
                                    });
                                }
                            }).catch(function(error) { 
                                console.log("解散小組錯誤：", error); 
                            });
                            
                            // 解散小組 - 更新入組狀態(自己)
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

                            // 解散小組 - 更新入組狀態(組員)


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

// ----------------------------------------組內互評頁面----------------------------------------
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
}])

// ----------------------------------------教師版主頁面----------------------------------------
.controller('root_pblCtrl', ['$scope', '$stateParams', '$ionicPopup', '$ionicLoading', '$state',
function ($scope, $stateParams, $ionicPopup, $ionicLoading, $state) {
    // 驗證登入
    firebase.auth().onAuthStateChanged((user) => {
        if (user.uid==="oZUljfdmzGQDQsaGJWBLgXo15NM2") { //登入成功，取得使用者
            console.log("已登入狀態");
            let originalUser = firebase.auth().currentUser;

            // 處理xlsx
            var persons = []; // 儲存獲取到的資料
            $('#excel-file').change(function(e) {
                var files = e.target.files;
                var fileReader = new FileReader();
                fileReader.onload = function(ev) {
                    try {
                        var data = ev.target.result
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
                                            batch.set(db.collection("帳號").doc(persons[index].學號), {Name:persons[index].姓名});
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
        }else{
            console.log("非管理員");
            $state.go("login");
        }
    });
}])

// ----------------------------------------教師版選單頁面----------------------------------------
.controller('rootmenuCtrl', ['$scope', '$stateParams', 
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

