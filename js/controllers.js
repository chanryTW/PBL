angular.module('app.controllers', [])

// ----------------------------------------登入頁面----------------------------------------
.controller('loginCtrl', ['$scope', '$stateParams', '$ionicPopup',
function ($scope, $stateParams, $ionicPopup) {
    // 登入
    var classL = document.getElementById("classL");
    var accountL = document.getElementById("accountL");
    var pwdL = document.getElementById("pwdL");
    var loginSmtBtn = document.getElementById("loginSmtBtn");
    loginSmtBtn.addEventListener("click",function(){
        $.ajax({
            url: "http://mis2.nkmu.edu.tw/kliou/pblfs/api.php/user/login",
            async: false,
            type: "POST",
            headers:{
                "content-type": "application/x-www-form-urlencoded",
                "Content-Security-Policy": "upgrade-insecure-requests"
            },
            data: {
                "course": classL.value,
                "sid": accountL.value,
                "pwd": pwdL.value
            },
            success: function(msg){
                console.log("登入成功");
                localStorage.setItem("course", classL.value);
                localStorage.setItem("sid", accountL.value);
                localStorage.setItem("sname", msg.sname);
                accountL.value="";
                pwdL.value="";
                open("/#/menu/pbl",'_self');
            },
            error: function(msg){
                console.log(msg.responseJSON.message);
                var alertPopup = $ionicPopup.alert({
                    title: '同學你打錯了',
                    template: msg.responseJSON.message
                });
                alertPopup.then(function(res) {
                    accountL.value="";
                    pwdL.value="";
                });
            }
        });
    },false);

}])

// ----------------------------------------主頁面----------------------------------------
.controller('pblCtrl', ['$scope', '$stateParams', 
function ($scope, $stateParams) {
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
.controller('brainstormingCtrl', ['$scope', '$stateParams', 
function ($scope, $stateParams) {
    // 更新
    updateBrain();
    function updateBrain() {
        document.getElementById("brainstorming_list").innerHTML = "";
        $.ajax({
            url: "http://mis2.nkmu.edu.tw/kliou/pblfs/api.php/bs/getbs",
            async: false,
            type: "POST",
            headers:{
                "content-type": "application/x-www-form-urlencoded",
            },
            data: {
                "course": "c2",
                "gno": "1",
                "from": "1"
            },
            success: function(msg){
                // console.log(msg.bs);
                console.log("更新腦力激盪列表");
                for (i=0;i<msg.bs.length;i++) {
                    document.getElementById("brainstorming_list").innerHTML = document.getElementById("brainstorming_list").innerHTML+'<div id="brainstorming_item" class="item"><h2>'+msg.bs[i].sname+'</h2><p>'+msg.bs[i].content+'</p></div>';
                }
            },
            error: function(msg){
                console.log(msg);
            }
        });
    }
    var updateBrain_Time = window.setInterval(updateBrain,5000);

    // 加入
    var brainstorming_input = document.getElementById("brainstorming_input");
    var brainstorming_SmtButton = document.getElementById("brainstorming_SmtButton");
    brainstorming_SmtButton.addEventListener("click",function(){
        $.ajax({
            url: "http://mis2.nkmu.edu.tw/kliou/pblfs/api.php/bs/addbs",
            async: false,
            type: "POST",
            headers:{
                "content-type": "application/x-www-form-urlencoded",
            },
            data: {
                "course": localStorage.getItem("course"),
                "sid": localStorage.getItem("sid"),
                "sname": localStorage.getItem("sname"),
                "gno": "1",
                "content": brainstorming_input.value
            },
            success: function(msg){
                console.log("新增腦力激盪成功");
                brainstorming_input.value="";
                updateBrain();
            },
            error: function(msg){
                console.log(msg.responseJSON.message);
                // var alertPopup = $ionicPopup.alert({
                //     title: '同學你打錯了',
                //     template: msg.responseJSON.message
                // });
                // alertPopup.then(function(res) {
                //     accountL.value="";
                //     pwdL.value="";
                // });
            }
        });
    },false);

}])

// ----------------------------------------提案聚焦頁面----------------------------------------
.controller('proposalCtrl', ['$scope', '$stateParams', 
function ($scope, $stateParams) {


}])

// ----------------------------------------分組評分頁面----------------------------------------
.controller('scoreCtrl', ['$scope', '$stateParams', 
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
        console.log("登出成功");
        localStorage.clear();
    },false);
    // var signOutSmtBtn = document.getElementById("menu-list-item5");
    // signOutSmtBtn.addEventListener("click",function(){
    //     firebase.auth().signOut().then(function() {
    //         console.log("登出成功");
    //         localStorage.clear();
    //     }).catch(function(error) {
    //         console.log("登出發生錯誤!");
    //     });
    // },false);
    
    // 設定授權文字位置
    $('#menu-heading2').css('top', window.innerHeight-620+'px');
}])

