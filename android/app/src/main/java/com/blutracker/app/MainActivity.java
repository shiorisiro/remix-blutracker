package com.blutracker.app;

import android.os.Bundle;
import android.view.View;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        ViewCompat.setOnApplyWindowInsetsListener(getWindow().getDecorView(), (v, insets) -> {
            int top = insets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
            int bottom = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
            int left = insets.getInsets(WindowInsetsCompat.Type.systemBars()).left;
            int right = insets.getInsets(WindowInsetsCompat.Type.systemBars()).right;
            
            v.setPadding(left, top, right, bottom);
            return WindowInsetsCompat.CONSUMED;
        });
        
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        controller.show(WindowInsetsCompat.Type.statusBars());
    }
}
