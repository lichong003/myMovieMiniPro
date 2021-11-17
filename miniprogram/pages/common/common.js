// pages/common/common.js
// import VueVideoPlayer from 'vue-video-player'
// const VueVideoPlayer = require('vue-video-player')
// import 'video.js/dist/video-js.css'
// Vue.use(VideoPlayer)
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    detail:{},
    content: '',
    src: '',
    score: 5,
    images:[],
    fileIds: [],
    movieid: -1,
    inputValue: '',
    videoContext:'',
    sliderValue: 0, //控制进度条slider的值，
    updateState: false, //防止视频播放过程中导致的拖拽失效
    playStates: true //控制播放 & 暂停按钮的显示
  },
  onContentChange: function(event){
    this.setData({
      content: event.detail
    })
  },
  upLoadImg: function(){
    wx.chooseImage({
      count: 9,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        // tempFilePath可以作为img标签的src属性显示图片
        const tempFilePaths = res.tempFilePaths;
        console.log(tempFilePaths);
        this.setData({
          images: this.data.images.concat(tempFilePaths)
        });
      }
    })
  },
  onScoreChange: function(event){
    this.setData({
      score: event.detail
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      movieid: options.movieid,
      updateState: true
    });
    // console.log(options);
    wx.cloud.callFunction({
      name: 'getDetail',
      data:{
        movieid: options.movieid
      }
    }).then(res => {
      console.log("详情："+res.result);
      this.setData({
        detail: res.result
    });
    }).catch(err => {
      console.log(err);
    })
  },
  submit: function(){
    wx.showLoading({
      title: '评论中..',
    })
    console.log(this.data.content,this.data.score);
    let promiseArr =[];
    for(let i=0; i< this.data.images.length; i++){
        promiseArr.push(new Promise((resolve,reject) => {
          let item =this.data.images[i];
          console.log(item);
          let suffix = /\.\w+$/.exec(item)[0];
          console.log(suffix);
          wx.cloud.uploadFile({
            cloudPath: new Date().getTime() + suffix,
            filePath: item, // 文件路径
          }).then(res => {
            // get resource ID
            wx.hideLoading();
            console.log(res.fileID);
            this.setData({
              fileIds: this.data.fileIds.concat(res.fileID)
            });
            resolve();
          }).catch(error => {
            // handle error
            console.log(error);
            wx.hideLoading();
            wx.showToast({
              title: '评论失败，'+error,
            });
            reject();
          })
        }))
    };
    Promise.all(promiseArr).then(res => {
        db.collection('common').add({
          data:{
            content : this.data.content,
            score: this.data.score,
            movieid: this.data.movieid,
            fileIds: this.data.fileIds
          }
        }).then(res => {
          wx.hideLoading();
          wx.showToast({
            title: '评价成功',
          })
        }).catch(err => {
          wx.hideLoading();
          wx.showToast({
            title: '评论失败，'+err,
          })
        });
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  /**
  * 打开本地视频
  */
 bindButtonTap: function() {
  var that = this
  //拍摄视频或从手机相册中选视频
  wx.chooseVideo({
   //album 从相册选视频，camera 使用相机拍摄，默认为：['album', 'camera']
   sourceType: ['album', 'camera'],
   //拍摄视频最长拍摄时间，单位秒。最长支持60秒
  //  maxDuration: 600,
   //前置或者后置摄像头，默认为前后都有，即：['front', 'back']
   camera: ['front','back'],
   //接口调用成功，返回视频文件的临时文件路径，详见返回参数说明
   success: function(res) {
    console.log(res.tempFilePaths[0])
    that.setData({
     src: res.tempFilePaths[0]
    })
   }
  })
 },
 /**
  * 当发生错误时触发error事件，event.detail = {errMsg: 'something wrong'}
  */
 videoErrorCallback: function(e) {
  console.log('视频错误信息:')
  console.log(e.detail.errMsg)
 },
 bindSendDanmu: function (e) {
  // console.log(e)
  this.videoContext= wx.createVideoContext(e.target.id);
  this.videoContext.sendDanmu({
      text: this.inputValue,
      color: "#ff4c91"
  })
},
bindInputBlur: function (e) {
  // console.log(e);
  console.log(e.detail.value);
  this.inputValue = e.detail.value
},
bindVideoEnterPictureInPicture() {
  console.log('进入小窗模式')
},

bindVideoLeavePictureInPicture() {
  console.log('退出小窗模式')
},

screenChange(res){
  console.log("screenChange->res:" + JSON.stringify(res))

},
bindplay:function(){//开始播放按钮或者继续播放函数
  console.log("开始播放")
},
bindpause:function(){//暂停播放按钮函数
  console.log("停止播放")

},
bindended:function(){//播放结束按钮函数
  console.log("播放结束")
},
bindtimeupdate:function(res){//播放中函数，查看当前播放时间等
  console.log(res)//查看正在播放相关变量
  console.log("播放到第"+res.detail.currentTime+"秒")//查看正在播放时间，以秒为单位
},
 //播放条时间改表触发
 videoUpdate(e) {
  if (this.data.updateState) { //判断拖拽完成后才触发更新，避免拖拽失效
    let sliderValue = e.detail.currentTime / e.detail.duration * 100;
    this.setData({
      sliderValue: sliderValue,
      duration: e.detail.duration
    })
  }
},
sliderChanging(e) {
  this.setData({
    updateState: false //拖拽过程中，不允许更新进度条
  })
},
//拖动进度条触发事件
sliderChange(e) {
  if (this.data.duration) {
    this.videoContext.seek(e.detail.value / 100 * this.data.duration); //完成拖动后，计算对应时间并跳转到指定位置
    this.setData({
      sliderValue: e.detail.value,
      updateState: true, //完成拖动后允许更新滚动条
      playStates: false //完成拖动后允许更新滚动条
    })
  }
},
videoOpreation() {
  this.data.playStates ? this.videoContext.pause() : this.videoContext.play();
  this.setData({
   playStates: !this.data.playStates
  })
 },
})
