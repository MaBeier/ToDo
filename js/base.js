;(function(){
	
	
	var $form_add_task =$('.add-task')
	  , $delete_task_trigger
	  , $detail_task_trigger
	  , $task_detail=$('.task-detail')
	  , $task_detail_mask=$('.task-detail-mask')
	  , task_list=[]
	  , current_index
	  , $update_form
	  , $task_detail_content
	  , $task_detail_content_input
	  , $checkbox_complete
	  , $msg=$('.msg')
	  , $msg_confirm=$msg.find('.confirmed')
	  , $alerter=$('.alerter')
	  ;	


	init();

	function listen_task_detail(){
		var index
		$('.task-item').on('dblclick',function(){
			index=$(this).data('index');
			//console.log('1',1)
			show_task_detail(index);
		})


		$detail_task_trigger.on('click',function(){
			var $this=$(this);
			var $item=$this.parent().parent().parent();
			index=$item.data('index');
			//console.log(index)
			show_task_detail(index);
		})
	}

	//监听完成TASK事件
	function listen_checkbox_complete(){
		$checkbox_complete.on('click',function(){
			var $this=$(this)
			//console.log($this);
			//var is_complete=$this.is(':checked');
			var index=$this.parent().parent().data('index');
			console.log(index);
			console.log(task_list[index])
			//update_task(index),{complete:is_complete};
			var item=get(index);
			//console.log(item)
			if(item.complete){
				//console.log(item);
				update_task(index,{complete:false});
			}
			else{
				//console.log(item);
				update_task(index,{complete:true});
			}
		})
	}

	function get(index){
		return store.get('task_list')[index];
	}

	//查看task详情
	function show_task_detail(index){
		//生成详情模板
		render_task_detail(index);
		current_index=index;
		//显示详情模板
		$task_detail.show();
		$task_detail_mask.show();
	}

	//更新TASK
	function update_task(index,data){
		//console.log(data);
		if(!index||!task_list[index])
			return; 
		
		task_list[index]=$.extend({},task_list[index],data);
		//console.log(task_list[index]);
		refresh_task_list();
	}


	//渲染指定task的详细信息
	function render_task_detail(index){
		if(index===undefined||!task_list[index]) return;
		var item=task_list[index];
		//console.log(task_list[index]);
		var tpl='<form>'+
			'<div class="content">'+
			item.content+
			'</div>'+
			'<div class="input-item"><input type="text" style="display:none" name="content" value="'+(item.content ||"")+'">'+
			'</div>'+
			'<div>'+
			'<div class="desc input-item">'+
			'<textarea name="desc">'+(item.desc ||"")+' </textarea>'+
			'</div>'+
			'</div>'+
			'<div class="remind input-item">'+
			'<label>提醒时间</label>'+
			'<input class="datetime" name="remind_date" type="text" value="'+(item.remind_date||"")+'">'+
			'</div>'+
			'<div class="input-item"><button type="submit">更新</button>'+
			'</div>'+
		    '</form>';


		 //清空TASK.再添加新模板
		 $task_detail.html(null);
		 $task_detail.html(tpl);
		 //$('.datetime').datetimepicker();
		 $('.datetime').datetimepicker();


		 $update_form=$task_detail.find('form');
		 $task_detail_content=$update_form.find('.content');
		 $task_detail_content_input=$update_form.find('[name=content]')

		 //双击显示Input可以改名
		  $task_detail_content.on('dblclick',function(){
				$task_detail_content_input.show();
				$task_detail_content.hide();
		  })

		// console.log($update_form);
		 $update_form.on('submit',function(e){
		 	e.preventDefault();
		 	//console.log('1',1)
		 	var data={};
		 	//获取表单中各个Input值
		 	data.content=$(this).find('[name=content]').val();
		 	data.desc=$(this).find('[name=desc]').val();
		 	data.remind_date=$(this).find('[name=remind_date]').val();

		 	//console.log(data)
		 	update_task(index,data);
		 	hide_task_detail();

		 })
	}

	//隐藏详情
	function hide_task_detail(){
		$task_detail.hide();
		$task_detail_mask.hide();
	}

	//查找并监听所有删除按钮的点击监听事件
	function listen_task_delete(){
		$delete_task_trigger.on('click',function(){
		var $this=$(this);
		//找到删除按钮所在的task元素
		var $item=$this.parent().parent().parent();
		var index=$item.data('index');
		var tmp=confirm('确定删除?');
		tmp ? delete_task(index):null;	

	})
	}

	$form_add_task.on('submit',on_add_task_form_submit);
	$task_detail_mask.on('click', hide_task_detail);

	function on_add_task_form_submit(e){
		var new_task={},$input;
		e.preventDefault();
		//获取输入值
		$input=$(this).find('input[name=content]');
		 new_task.content=$input.val(); 
		 if(!new_task.content) return;
		 //存入store
		 if(add_task(new_task)){
		 	$input.val(null);
		 }
	}

	

	function add_task(new_task){
		for(var k in new_task){
			if(new_task[k]===undefined)
				new_task[k]='';
		}
		task_list.push(new_task);//push直接更改值
		//更新store
		refresh_task_list();
		return true;		
	}

	//刷新localstorage并渲染tpl
	function refresh_task_list(){
		store.set('task_list',task_list);
		//console.log(task_list)
		render_task_list();
	}

	//删除一条task
	function delete_task(index){
		//如果没有index，或者index不存在
		if(index===undefined||!task_list[index]) return;

		delete task_list[index];
		//更新localstorage
		refresh_task_list();
	}

	function init(){	
		task_list=store.get('task_list')||[];
		//console.log(task_list);
		listen_msg_event();
		if(task_list.length){
			render_task_list();
			task_remind_check();
		}
	}

	function  task_remind_check(){
		var current_timestamp;

		var itl=setInterval(function(){
			for(var i=0;i<task_list.length;i++){
				var item=get(i),task_timestamp;
				if(!item || !item.remind_date ||item.informed) continue;

				current_timestamp = (new Date()).getTime();
				task_timestamp = (new Date(item.remind_date)).getTime();
				//console.log(current_timestamp);console.log(task_timestamp)
				if (current_timestamp-task_timestamp>=1) {
					update_task(i,{informed:true});
					 show_msg(item.content);
				}
		}
	},300);
		
	}

	function listen_msg_event(){
		$msg_confirm.on('click',function(){
			hide_msg();
		})
	}

	function show_msg(msg){
		//if(!msg) return;
		//console.log('1',1);
		$msg_confirm.html(msg);
		$alerter.get(0).play();
		$msg.show();
	}


	function hide_msg(){
		//console.log('1',1);
		$msg.hide()
	}

	//渲染全部task模板
	function render_task_list(){
		var $task_list=$('.task-list');
		$task_list.html(' ');
		var complete_items=[];
		for(var i=0;i<task_list.length;i++){
			var item=task_list[i];
			if(item && item.complete){
				complete_items[i]=item;

			}
			else{
			var $task=render_task_item(task_list[i],i);
			//console.log($task);
			
			$task_list.prepend($task);}
			//console.log('1',$task_list);
		}

		for(var j=0;j<complete_items.length;j++){
			$task=render_task_item(complete_items[j],j);
			if(!$task) continue;
			$task.addClass('completed');
			$task_list.append($task);
			//console.log('2',$task_list)
		}

		$delete_task_trigger=$('.action.delete');
		$detail_task_trigger=$('.action.detail');
		$checkbox_complete=$('.complete[type=checkbox]');
		//console.log($checkbox_complete);
		listen_task_delete();
		listen_task_detail();
		listen_checkbox_complete();
	}	

	//渲染单条task模板
	 function render_task_item(data,index){
		//console.log(data);
		if(!data||!index) return
		var list_item_tpl=
			'<div class="task-item" data-index="'+ index +'">'+
			'<span><input type="checkbox" '+(data.complete?"checked":"")+' class="complete" ></span>'+
			'<sapn class="task-content">'+data.content+'</span>'+
			'<span class="fr">'+
			'<span class="action delete">删除</span>'+
			'<span class="action detail">详情</span>'+
			'</span>'+
			'</div>';
				//console.log(list_item_tpl);
		
		return $(list_item_tpl);
	}
})();