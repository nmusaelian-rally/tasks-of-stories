Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    scopeType: 'iteration',
    comboboxConfig: {
        fieldLabel: 'Select an Iteration:',
        labelWidth: 100,
        width: 300
    },
   onScopeChange: function() {
        Ext.create('Rally.data.WsapiDataStore', {
            model: 'UserStory',
            fetch: ['FormattedID','Name','Tasks'],
            pageSize: 100,
            autoLoad: true,
            filters: [this.getContext().getTimeboxScope().getQueryFilter()],
            listeners: {
                load: this._onDataLoaded,
                scope: this
            }
        }); 
    },
    
    _createGrid: function(stories) {
        var myStore = Ext.create('Rally.data.custom.Store', {
                data: stories,
                pageSize: 100,  
            });
        if (!this.grid) {
        this.grid = this.add({
            xtype: 'rallygrid',
            itemId: 'mygrid',
            store: myStore,
            columnCfgs: [
                {
                   text: 'Formatted ID', dataIndex: 'FormattedID', xtype: 'templatecolumn',
                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
                },
                {
                    text: 'Name', dataIndex: 'Name'
                },
                {
                    text: 'Task Count', dataIndex: 'TaskCount'
                },
                {
                    text: 'Tasks', dataIndex: 'Tasks', 
                    renderer: function(value) {
                        var html = [];
                        Ext.Array.each(value, function(task){
                            html.push('<a href="' + Rally.nav.Manager.getDetailUrl(task) + '">' + task.FormattedID + '</a>')
                        });
                        return html.join(', ');
                    }
                }
            ]
        });
         
         }else{
            this.grid.reconfigure(myStore);
         }
    },
    _onDataLoaded: function(store, data){
                var stories = [];
                var pendingTasks = data.length;
                
                Ext.Array.each(data, function(story) {
                            var s  = {
                                FormattedID: story.get('FormattedID'),
                                Name: story.get('Name'),
                                _ref: story.get("_ref"),
                                TaskCount: story.get('Tasks').Count,
                                Tasks: []
                            };
                            
                            var tasks = story.getCollection('Tasks');
                            tasks.load({
                                fetch: ['FormattedID'],
                                callback: function(records, operation, success){
                                    Ext.Array.each(records, function(task){
                                        s.Tasks.push({_ref: task.get('_ref'),
                                                        FormattedID: task.get('FormattedID')
                                                    });
                                    }, this);
                                    
                                    --pendingTasks;
                                    if (pendingTasks === 0) {
                                        this._createGrid(stories);
                                    }
                                },
                                scope: this
                            });
                            stories.push(s);
                }, this);
    }             
});
