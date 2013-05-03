/*
	EfTemplator v0.3
	Copyright (C) 2011 Yevgen Grytsay
	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.
	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU General Public License for more details.
	You should have received a copy of the GNU General Public License
	along with this program. If not, see <http://www.gnu.org/licenses/>.
	If you have any questions or ideas on how to make it better, contact
	me please: <yevgen_grytsay@mail.ru>.
*/

(function(){	
	var opener = ['if', 'foreach'];
	var closer = ['endif', 'endforeach'];
	
	var foreachRE	= new RegExp("^\\{{2}foreach\\s+([a-z$_][a-z0-9$_]*(?:\\.[a-z0-9$_]+)*)\\s+as\\s+([a-z$_][a-z0-9$_]*)", 'i');
	var ifRE		= new RegExp("^\\{{2}if\\s+([a-z$_][a-z0-9$_]*(?:\\.[a-z0-9$_]+)*)\\s+(==|!=|>|<|>=|<=|in|defined)\\s+((?:['\"].*['\"])|(?:[a-z0-9$_]+(?:\\.[a-z0-9$_]+)*))", 'i');
	var varNameRE	= new RegExp("([a-z$_][a-z0-9$_]*(\\.[a-z0-9$_])*)", 'i');
	
	var SYNTAX_ERROR			= 'Syntax error.';
	var FOREACH_SYNTAX_ERROR	= '\'Foreach\' operator syntax error.';
	var IF_SYNTAX_ERROR			= '\'If\' operator syntax error.';
	
	var handlers = {
		foreachHandler: function( cmdString, data ) {
			var cmdParts = foreachRE.exec( cmdString );
			
			if(!cmdParts || cmdParts.length < 3) throw FOREACH_SYNTAX_ERROR;
	
			var arrName			= cmdParts[1];
			var localVarName	= cmdParts[2];
			var array			= getVariableValue( data, arrName );			
			var len		= array.length;
			var html	= '';
	
			var localData = new Object( data );
			
			cmdString = cmdString.slice( cmdString.indexOf( '}}' ) + 2, cmdString.lastIndexOf( '{{' ) );
			
			for(var i = 0; i < len; i++) {
				localData[localVarName] = array[i];
				
				if(typeof localData[localVarName]['iterator'] == 'undefined') {
					localData[localVarName]['iterator'] = i;
				}
				
				html += wrap( cmdString, localData );
			}
			
			return html;
		},
	
		ifHandler: function( cmdString, data ) {
			var html		= '';
			var cmdParts	= ifRE.exec( cmdString );
			
			var left		= cmdParts[1] || null;
			var operator	= cmdParts[2] || null;
			var right		= cmdParts[3] || null;
			
			if( !(left && operator && right) ) throw IF_SYNTAX_ERROR;
			
			right = getVariableValue( data, right );			
			left  = getVariableValue( data, left );
			
			var evalRes = false;
			
			switch(operator) {
				case '==':
					evalRes = (left.toString() == right.toString());
					break;
				case '!=':
					evalRes = (left.toString() != right.toString());
					break;
				case '>':
					evalRes = (left > right);
					break;
				case '<':
					evalRes = (left < right);
					break;
				case '>=':
					evalRes = (left >= right);
					break;
				case '<=':
					evalRes = (left <= right);
					break;
				case 'in':
					evalRes = inArray(right, left);
					break;
				case 'defined':
					break;
				default:
					break;
			}
			
			if(evalRes) {
				cmdString = cmdString.slice( cmdString.indexOf( '}}' ) + 2, cmdString.lastIndexOf( '{{' ) );
				html = wrap( cmdString, data );
			}
			
			return html;
		},
		
		echoHandler: function( cmdString, data ) {
			cmdString = cmdString.slice( cmdString.indexOf( '{{' ) + 2, cmdString.lastIndexOf( '}}' ) );
			var val = getVariableValue( data, cmdString );
			
			return val;
		}	
	} // handlers END
	
	function executeCommand( cmdContent, data ) {
		var type = getCommandType( cmdContent );
		var handler = null;
		
		if(!(handler = handlers[type + 'Handler'])) {
			handler = handlers['echoHandler'];
		}
		
		return handler( cmdContent, data );
	}
	
	function wrap( template, data ) {
		var parts = [];
		var html = '';
		
		do {
			parts = splitByNextCmd( template );
			
			if(parts[0]) html += parts[0];
			
			if(parts[1]) {
				html += executeCommand( parts[1], data );
			} else {
				break;
			}
			
			if(parts[2]) {
				template = parts[2];
			} else {
				break;
			}
			
		} while(true);
		
		return html;
	}
	
	function splitByNextCmd( template ) {
		var cmdRe = new RegExp("\\{{2}(\\w+)", 'g');
		var matches = cmdRe.exec( template );
	
		if(!matches) return [template];
	
		var endCmd = getCommandEndIndex( template, cmdRe );
		
		// TODO: handle error
		if(endCmd == -1) return [template];
	
		return [
			template.slice( 0, matches.index ),
			template.slice( matches.index, endCmd + 2 ),
			template.slice( endCmd + 2 )
		];
	}
	
	function getCommandEndIndex( template, cmdRe ) {
		var type = getCommandType( RegExp.lastMatch );
		var nestingModifierSum = 1;
		var endType = 'end' + type;
	
		if(inArray( opener, type )) {
			
			while((matches = cmdRe.exec(template)) != null) {
	
				nestingModifierSum += getNestingModifier( RegExp.lastMatch );
				
				if(nestingModifierSum == 0) {
					curType = getCommandType( RegExp.lastMatch );
					
					if(endType == curType) {
						endIndex = template.indexOf( '}}', cmdRe.lastIndex );
						
						if(endIndex == -1) throw SYNTAX_ERROR;
						
						return endIndex;
					} else {
						throw "'"+ endType +"' tag expected (but found '"+ curType +"').";
					}
				}
			}
			
			
		} else {
			return template.indexOf( '}}', RegExp.lastIndex );
		}
		
		return false;
	}
	
	//TODO: get out of reg exp here
	function getCommandType( cmdString ) {
		var matches = /^(?:\{\{)?([a-z0-9_]+)/i.exec( cmdString );
		
		return matches[1] || null;
	}
	
	function getNestingModifier( cmdString, type ) {
		var type = type || getCommandType( cmdString );
		
		if(type == null) return 0;
		
		if(inArray( opener, type )) return 1;
		
		if(inArray( closer, type )) return -1;
		
		return 0;
	}
	
	// TODO: add 'strict' flag which tells wether to use '==='
	function inArray(arr, el) {
		for(var i = 0; i < arr.length; i++) {
			
			if(arr[i] == el) return true;
		}
		return false;
	}
	
	function getVariableValue( data, name ) {
		
		if(/^\d/.test( name )) {
			return parseInt(name);
		}
		
		// or just return name string as is
		if(!varNameRE.test( name )) throw "'"+ name +"' is not proper variable name.";
		
		var nameParts = name.split( '.' );
		var len = nameParts.length;
		var curObj = data;
	
		for(var i = 0; i < len; i++) {
			if(typeof curObj[ nameParts[i] ] === 'undefined') return name;
			curObj = curObj[ nameParts[i] ];
		}
		
		return curObj;
	}
	
	window.templator = {
		wrap: wrap
	};

})();
