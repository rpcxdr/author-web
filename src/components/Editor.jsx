import { CKEditor } from '@ckeditor/ckeditor5-react';

import { 
    ClassicEditor, Essentials, Paragraph, Bold, Italic,
    Image, ImageInsert, ImageCaption, ImageResize, ImageStyle, ImageToolbar, LinkImage,
    Font, FontSize, FontColor, FontBackgroundColor,
    List, Heading,
 } from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

export default function CKEditorDemo({ value = "", onChange = () => {} }) {
  return (
    <div style={{ marginTop: 8 }}>
      <CKEditor
            editor={ ClassicEditor }
            data={ '<p>Hello world!</p>' }
            onChange={ (event, editor) => onChange(editor.getData()) } 
            onReady={editor => {
                editor.ui.view.editable.element.style.height = "400px";
                editor.ui.view.editable.element.style.minHeight = "300px";
                editor.ui.view.editable.element.style.maxHeight = "500px";
            }}
            config={ {
                licenseKey: 'GPL',
                plugins: [ 
                    Essentials, Paragraph, Bold, Italic,
                    Image, ImageInsert, ImageCaption, ImageResize, ImageStyle, ImageToolbar, LinkImage,
                    Font, FontSize, FontColor, FontBackgroundColor,
                    List, Heading,
                ],
                toolbar: [ 
                    'undo', 'redo', 
                    '|', 
                    'bold', 'italic', 
                    '|', 
                    'heading', 'fontfamily', 'fontsize', 'fontColor', 'fontBackgroundColor',
                    'numberedList', 'bulletedList', 
                    '|',
                    'insertImageViaUrl', 'toggleImageCaption', 'imageTextAlternative', ],
                image: {
                    toolbar: [
                        'imageStyle:inline',
                        'imageStyle:breakText',
                        'imageStyle:wrapText',
                        '|',
                        'toggleImageCaption',
                        'imageTextAlternative'
                    ]  
                },
                initialData: value,
            } }
        />
    </div>
  );
}