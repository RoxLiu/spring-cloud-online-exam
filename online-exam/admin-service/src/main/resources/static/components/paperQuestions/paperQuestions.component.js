'use strict'

angular.module('paperQuestions')
    .component('paperQuestions', {
        templateUrl: 'components/paperQuestions/paperQuestions.template.html',
        controller: function ($scope, $http, $state, $timeout, PaperQuestionService, $modal, $window, $stateParams) {

            $scope.url = '/exam/v1/questions/';

            /*试卷id*/
            $scope.paperId = $stateParams.paperId;

            /*加载标志*/
            $scope.isLoading = true;

            /*搜索标志*/
            $scope.isSearch = false;

            /*试卷列表*/
            $scope.questions = null;

            /*保存搜索框内容*/
            $scope.questionName = "";

            //查看题目信息
            var infoModal = $modal({
                scope: $scope,
                templateUrl: 'components/questionList/questionInfo.template.html',
                show: false
            });

            //编辑题目信息
            var editModal = $modal({
                scope: $scope,
                templateUrl: 'components/questionList/editQuestion.template.html',
                show: false
            });

            /*===============================================*/

            /**
             * 刷新页面
             */
            var reloadState = function() {
                $state.reload();
            };

            $scope.showInfoModal = function(id) {
                //根据id查询题目信息
                if (id != null) {
                    $http.get("/exam/v1/questions/" + id).then(function(response) {
                        //赋值
                        response.data.score = Number(response.data.score);
                        response.data.number = Number(response.data.number);
                        $scope.question = response.data;
                        //显示查询信息
                        infoModal.$promise.then(infoModal.show);
                    }, function(error) {
                        alert("error");
                    });
                }
            };


            $scope.showEditModal = function(id) {
                if (id != null) {
                    $http.get("/exam/v1/questions/" + id).then(function(response) {
                        //赋值
                        response.data.score = Number(response.data.score);
                        response.data.number = Number(response.data.number);
                        $scope.question = response.data;
                        //显示查询信息
                        editModal.$promise.then(editModal.show);
                    });
                }
            };

            /*更新题目*/
            $scope.updateQuestion = function () {
                $http.put('/exam/v1/questions', $scope.question).then(function (response) {
                    //保存成功
                    $(".save-success").removeClass("in").show();
                    $(".save-success").delay(200).addClass("in").fadeOut(2000);
                    //隐藏弹窗
                    $timeout(function () {
                        editModal.$promise.then(editModal.hide);
                        reloadState();
                    }, 2000);

                }, function (error) {
                    //保存失败
                    $(".save-fail").removeClass("in").show();
                    $(".save-fail").delay(200).addClass("in").fadeOut(2000);
                    //隐藏弹窗
                    $timeout(function () {
                        editModal.$promise.then(editModal.hide);
                        reloadState();
                    }, 2000);
                });
            };

            $scope.deleteQuestion = function(id) {

                if (confirm('是否删除?')) {
                    /*http delete 后台*/
                    $http.delete("/exam/v1/questions/" + id).then(function(response) {
                        console.log(response);
                    });
                    reloadState();
                }
            };

            /* 以分页方式获取试卷列表 */
            $scope.callServer = function callServer(tableState) {
                $scope.isLoading = true;

                var pagination = tableState.pagination;

                var start = pagination.start || 0;
                var number = pagination.number || 10;

                PaperQuestionService.getPage(start, number, tableState, $scope.paperId).then(function(result) {
                    if (result.data == null || result.data.length == 0) {
                        $scope.questions = null;
                    } else {
                        $scope.questions = result.data;
                    }
                    tableState.pagination.numberOfPages = result.numberOfPages;
                    $scope.isLoading = false;
                });
            }

            /* 搜索功能 */
            $scope.search = function() {
                $scope.isSearch = true;
                if ($scope.questionName != "") {
                    $http.get("/exam/v1/questions/name/" + $scope.questionName).then(function(response) {
                        if(response.data.length == 0) {
                            $scope.questions = null;
                        }else {
                            $scope.questions = response.data;
                        }
                    });
                }else {
                    reloadState();
                }
            }

        }
    });


angular.module('paperQuestions').factory('PaperQuestionService', ['$q', '$filter', '$timeout', '$http', '$injector', function($q, $filter, $timeout, $http, $injector) {

    var questions = []; //题目数组,用于保存查询结果
    function getPage(start, number, params, paperId) {
        var deferred = $q.defer();
        var filtered = params.search.predicateObject ? $filter('filter')(questions, params.search.predicateObject) : questions;
        if (params.sort.predicate) {
            filtered = $filter('orderBy')(filtered, params.sort.predicate, params.sort.reverse);
        }

        var result = null;
        var pages = null;

        $http.get('/exam/v1/questions/papers/' + paperId + '?pageIndex=' + (start / 10 + 1) + '&pageSize=' + number).then(function(response) {

            result = response.data.list;

            pages = response.data.pages;

            $timeout(function() {

                deferred.resolve({
                    data: result,
                    numberOfPages: Math.ceil(pages)
                });
            }, 500);

        }, function(error) {
            /*if(error.status === 404) {
             $injector.get('$state').transitionTo('404');
             }*/
        });
        return deferred.promise;
    }
    return {
        getPage: getPage
    };
}]);