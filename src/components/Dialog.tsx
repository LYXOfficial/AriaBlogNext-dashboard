import { ReactElement } from "react";
import {
    Dialog,
    DialogTrigger,
    DialogSurface,
    DialogTitle,
    DialogBody,
    DialogActions,
    DialogContent,
    Button,
} from "@fluentui/react-components";

export declare interface BaseDialogProps{
    title:string,
    content:React.ReactNode,
    onConfirm:()=>void,
    onClose:()=>void,
    open:boolean,
}

export const BaseDialog=(
    {title,content,open,onConfirm,onClose}:
    BaseDialogProps
)=>{
    return (
        <Dialog open={open}>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogContent>
                        {content}
                    </DialogContent>
                    <DialogActions>
                        <DialogTrigger disableButtonEnhancement>
                            <Button appearance="secondary" onClick={onClose}>取消</Button>
                        </DialogTrigger>
                            <Button appearance="primary" onClick={onConfirm}>确定</Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
};