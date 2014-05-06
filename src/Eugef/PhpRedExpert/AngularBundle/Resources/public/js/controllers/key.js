App.controller('KeyController', ['$scope', '$routeParams', '$location', 'RedisService',
    function ($scope, $routeParams, $location, RedisService) {
        console.log('KeyController');
        console.log($routeParams);

        $scope.key = {};
        $scope.keyValue = {};
        $scope.alerts = [];
        
        $scope.initAddKey = function(keyType) {
            console.log('initAddKey');
            $scope.key = {
                new: true,
                type: keyType,
                ttl: 0
            }
            
            switch (keyType) {
                case 'string':
                    $scope.keyValue.value = '';
                    break;
                case 'hash':
                    $scope.keyValue = {
                        name: '',
                        value: ''
                    };
                    break;
                case 'list':
                    $scope.keyValue = {
                        value: ''
                    };
                    break;    
            }
        }

        $scope.initEditKey = function(keyName) {
            console.log('initEditKey');
            return RedisService.viewKey($scope.current.serverId, $scope.current.dbId, keyName).then(
                function(response) {
                    $scope.key = response.data.key;
                    $scope.key.ttl = $scope.key.ttl < 0 ? 0 : $scope.key.ttl; 
                    
                    switch ($scope.key.type) {
                        case 'string':
                            $scope.keyValue.value = $scope.key.value;
                            break;
                        case 'hash':
                            $scope.keyValue = {};
                            break;
                    }
                    console.log($scope.key)
                    console.log('// initEditKey');
                },
                function(response) {
                    // key not found - add its name for warning message
                    $scope.key = {
                        name: keyName
                    };
                }
            );    
        }
        
        $scope.submitKey = function() {
            key = {
                name: $scope.key.name,
                type: $scope.key.type,
                ttl: $scope.key.ttl,
                value: $scope.keyValue
            };
            
            if ($scope.key.new) {
                console.log('submitKey: add');
                return RedisService.addKey($scope.current.serverId, $scope.current.dbId, key).then(
                    function(response) {
                        $scope.key = response.data.key;
                        $scope.key.ttl = $scope.key.ttl < 0 ? 0 : $scope.key.ttl;
                        $location.path('server/' + $scope.current.serverId + '/db/' + $scope.current.dbId + '/key/view/' + encodeURIComponent($scope.key.name), false);
                        //$scope.alerts.push({type: 'success', message: 'Key is succesfully created'});
                        
                        switch ($scope.key.type) {
                            case 'string':
                                $scope.keyValue.value = $scope.key.value;
                                break;
                            case 'hash':
                                $scope.keyValue = {};
                                break;
                        }
                        
                        // increase amount of keys in whole db
                        $scope.$parent.getCurrentDB().keys++;
                        
                        console.log('// submitKey / add');
                    },
                    function(response) {
                        $scope.alerts.push({type: 'danger', message: 'Key is not created'});
                        console.log('// submitKey / add /error');
                    }
                );
            }
            else {
                console.log('submitKey: edit');
                return RedisService.editKey($scope.current.serverId, $scope.current.dbId, key).then(
                    function(response) {
                        $scope.key = response.data.key;
                        $scope.key.ttl = $scope.key.ttl < 0 ? 0 : $scope.key.ttl;
                        //$scope.alerts.push({type: 'success', message: 'Key is succesfully updated'});
                        switch ($scope.key.type) {
                            case 'string':
                                $scope.keyValue.value = $scope.key.value;
                                break;
                            case 'hash':
                                $scope.keyValue = {};
                                break;
                        }
                        
                        console.log('// submitKey / edit');
                    },
                    function(response) {
                        $scope.alerts.push({type: 'danger', message: 'Key is not updated'});
                        console.log('// submitKey / edit /error');
                    }
                );
            }
        }
        
        $scope.deleteHashField = function(hash) {
            var execute = function() {
                return RedisService.editKey($scope.current.serverId, $scope.current.dbId, key).then(
                    function(response) {
                        if (response.data.key) {
                            //update key
                            $scope.key = response.data.key;
                            $scope.key.ttl = $scope.key.ttl < 0 ? 0 : $scope.key.ttl;
                            //$scope.alerts.push({type: 'success', message: 'Key hash is succesfully deleted'});
                        }
                        else {
                            //remove key from scope
                            $scope.key = {
                                name: key.name
                            };
                            
                            // reduce amount of keys in whole db
                            $scope.$parent.getCurrentDB().keys --;
                            
                            $scope.alerts.push({type: 'success', message: 'Key is succesfully deleted'});
                        }
                        
                        console.log('// deleteHashField');
                    },
                    function(response) {
                        $scope.alerts.push({type: 'danger', message: 'Key hash is not deleted'});
                        console.log('// deleteHashField / error');
                    }
                );
            }
            
            console.log('deleteHashField: ');
            key = {
                name: $scope.key.name,
                type: $scope.key.type,
                value: {
                    name: hash,
                    delete: true
                }    
            };
            if ($scope.key.size > 1) {
                execute();
            }
            else {
                $scope.$parent.showModalConfirm({
                    title: 'Delete key forever?',
                    message: 'Key is about to be permanently deleted because no hash fields are left:',
                    items: [key.name],
                    warning: 'You can\'t undo this action!',
                    action: 'Delete'
                }).result.then(function() {
                    execute();
                });
            }
            
        }
        
        $scope.editKeyTtl = function() {
            console.log('editKeyTtl');
                
            $scope.$parent.showModal('ModalEditKeyAttributeController', 'editkeyttl.html',                  
                {
                    value: $scope.key.ttl,
                    key: $scope.key.name
                }
            ).result.then(function(newTtl) {
                RedisService.editKeyAttributes($scope.current.serverId, $scope.current.dbId, $scope.key.name, {ttl: newTtl}).then(
                    function(response) {
                        $scope.key.ttl = newTtl;
                        console.log('editKeyTtl / done');
                    }
                );
            });
            
        }  
        
        $scope.editKeyName = function() {
            console.log('editKeyName');
            
            $scope.$parent.showModal('ModalEditKeyAttributeController', 'editkeyname.html',                 
                {
                    value: $scope.key.name,
                    key: $scope.key.name
                }
            ).result.then(function(newName) {
                if (newName != $scope.key.name) {
                    RedisService.editKeyAttributes($scope.current.serverId, $scope.current.dbId, $scope.key.name, {name: newName}).then(
                        function(response) {
                            if (response.data.result.name) {
                                $scope.key.name = newName;
                                // update key name in url
                                $location.path('server/' + $scope.current.serverId + '/db/' + $scope.current.dbId + '/key/view/' + encodeURIComponent($scope.key.name), false);
                            }
                            else {
                                $scope.$parent.showModalAlert({
                                    title: 'Rename error!',
                                    message: 'Could not rename key "' + $scope.key.name + '" to "' + newName + '"'
                                });
                            }

                            console.log('editKeyName / done');
                        }
                    );
                }
            });
        } 
        
        $scope.deleteKey = function() {
            console.log('deleteKey');
            var deleteKeys = [$scope.key.name];
            if (deleteKeys) {
                $scope.$parent.showModalConfirm({
                    title: 'Delete key forever?',
                    message: 'Key is about to be permanently deleted:',
                    items: deleteKeys,
                    warning: 'You can\'t undo this action!',
                    action: 'Delete'
                }).result.then(function() {
                    RedisService.deleteKeys($scope.current.serverId, $scope.current.dbId, deleteKeys).then(
                        function(response) {
                            //remove key from scope
                            $scope.key = {
                                name: $scope.key.name
                            };
                            
                            // reduce amount of keys in whole db
                            $scope.$parent.getCurrentDB().keys -= response.data.result;
                            
                            $scope.alerts.push({type: 'success', message: 'Key is succesfully deleted'});
                            
                            console.log('deleteKey / done');
                        }
                    );
                });
            }
        }
        
        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
        
        $scope.init($routeParams.serverId, $routeParams.dbId).then(function() {
            if (angular.isDefined($routeParams.key)) {
                $scope.$parent.view = {
                    title: 'View key',
                    subtitle: $routeParams.key,
                };
            
                $scope.initEditKey($routeParams.key);
            }
            else {
                $scope.$parent.view = {
                    title: 'Add key',
                    subtitle: $routeParams.type,
                };
                
                $scope.initAddKey($routeParams.type);
            }
            
        });        
    }
]);