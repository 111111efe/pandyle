/// <reference path="statics.ts" />
namespace Pandyle {
    export interface component {
        name: string,
        html: string,
        onLoad?: (context:any, root:HTMLElement)=>void
    }

    export function hasComponent(name: string) {
        return typeof _components[name] !== 'undefined';
    }

    export function addComponent(com: component) {
        _components[com.name] = com;
    }

    export function getComponent(name: string):component {
        return _components[name];
    }

    export function loadComponent(ele: HTMLElement) {
        let element = $(ele);
        element.children().remove();
        let name = element.attr('p-com');
        let domData = Pandyle.getDomData(element);
        let context = domData.context;
        name = $.trim(name);
        if (hasComponent(name)) {
            let com = getComponent(name);
            element.html(com.html);
            let children = element.children();       
            children.each((index, item) => {
                let childrenDomData = Pandyle.getDomData($(item));
                childrenDomData.context = context;
            })
            domData.children =children;
            if(com.onLoad){
                com.onLoad(context, ele);
            }
        } else {
            let url = '';
            if (/^@.*/.test(name)) {
                url = name.replace(/^@/, '');
            } else {
                let fullpath = name.split('.');
                let path = Pandyle._config.comPath
                    ? Pandyle._config.comPath['Default'] || './components/{name}.html'
                    : './components/{name}.html';
                if (fullpath.length > 1) {
                    path = Pandyle._config.comPath[fullpath[0]];
                    url = path.replace(/{.*}/g, fullpath[1]);
                } else {
                    url = path.replace(/{.*}/g, name);
                }
            }
            $.ajax({
                url: url,
                async: false,
                success: res => {
                    insertToDom(res, name, context, ele);
                }
            })
        }

        function insertToDom(text: string, name: string, context:any, root:HTMLElement) {
            let component:component = {name: name, html: ''};
            text = text.replace(/<\s*style\s*>((?:.|\r|\n)*?)<\/style\s*>/g, ($0, $1) => {
                let style = '<style>' + $1 + '</style>';
                $('head').append(style);
                return '';
            });  
            text = text.replace(/<\s*script\s*>((?:.|\r|\n)*?)<\/script\s*>/g, ($0, $1) => {
                new Function($1).call(component);
                return '';
            });
            component.html = text;
            addComponent(component);
            element.html(text);
            let children = element.children();
            children.each((index, item) => {
                Pandyle.getDomData($(item)).context = context;
            })
            Pandyle.getDomData(element).children = children;
            if(component.onLoad){
                component.onLoad(context, root);
            }
        }
    }
}