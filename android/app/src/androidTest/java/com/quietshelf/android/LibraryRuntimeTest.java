package com.quietshelf.android;

import android.Manifest;
import android.content.pm.PackageInfo;
import android.webkit.WebView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.*;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.io.File;
import java.io.FileOutputStream;
import java.util.Arrays;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class LibraryRuntimeTest {
    private String evaluate(ActivityScenario<MainActivity> scenario,String code)throws Exception{
        CountDownLatch done=new CountDownLatch(1);String[] result={null};
        scenario.onActivity(activity->activity.web.evaluateJavascript(code,value->{result[0]=value;done.countDown();}));
        assertTrue("JavaScript evaluation timed out",done.await(15,TimeUnit.SECONDS));return result[0];
    }
    private void ready(ActivityScenario<MainActivity> scenario)throws Exception{
        for(int i=0;i<150;i++){if("true".equals(evaluate(scenario,"!!globalThis.QuietShelfApp && !!globalThis.QuietShelfAccount && !!globalThis.QuietShelfAndroid?.back")))return;Thread.sleep(100);}
        fail("The Android app did not finish loading its shared interface");
    }
    private void screenshot(ActivityScenario<MainActivity> scenario,String name)throws Exception{
        CountDownLatch drawn=new CountDownLatch(1);
        scenario.onActivity(activity->activity.web.postVisualStateCallback(1,new WebView.VisualStateCallback(){@Override public void onComplete(long id){drawn.countDown();}}));
        assertTrue("WebView did not finish drawing",drawn.await(15,TimeUnit.SECONDS));
        InstrumentationRegistry.getInstrumentation().waitForIdleSync();Thread.sleep(250);
        android.graphics.Bitmap bitmap=InstrumentationRegistry.getInstrumentation().getUiAutomation().takeScreenshot();
        File folder=new File(InstrumentationRegistry.getInstrumentation().getTargetContext().getExternalFilesDir(null),"previews");folder.mkdirs();
        try(FileOutputStream out=new FileOutputStream(new File(folder,name+".png"))){bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG,100,out);}bitmap.recycle();
    }
    @Test public void libraryThemesHistoryBackupAndRestart()throws Exception{
        try(ActivityScenario<MainActivity> app=ActivityScenario.launch(MainActivity.class)){
            ready(app);
            assertEquals("true",evaluate(app,"(()=>{QuietShelfApp.apply({library:[],preferences:{theme:'ink',autoUpdateChecks:false}});QuietShelfApp.changed?.();document.querySelector('#add').click();document.querySelector('#title').value='Android runtime title';document.querySelector('#author').value='Test author';document.querySelector('#addForm').requestSubmit();return QuietShelfApp.snapshot().library.length===1&&QuietShelfApp.snapshot().library[0].status==='Unread'})()"));
            assertEquals("true",evaluate(app,"(()=>{setStatus('In progress');setStatus('Done');const b=QuietShelfApp.snapshot().library[0];return b.status==='Done'&&b.history.length===1&&!!b.history[0].date&&!!b.history[0].startDate})()"));
            assertEquals("true",evaluate(app,"(()=>{document.querySelector('.titlebutton').click();return document.body.classList.contains('android-detail-open')})()"));
            assertEquals("true",evaluate(app,"QuietShelfAndroid.back()"));
            for(String theme:new String[]{"ink","sage","tide","rosewood","porcelain","apricot"}){
                assertEquals("true",evaluate(app,"(()=>{document.querySelector('#theme').value='"+theme+"';document.querySelector('#theme').dispatchEvent(new Event('change',{bubbles:true}));return document.documentElement.dataset.theme==='"+theme+"'&&QuietShelfApp.backup().preferences.theme==='"+theme+"'&&QuietShelfApp.snapshot().library[0].history.length===1&&document.documentElement.scrollWidth<=innerWidth})()"));
                screenshot(app,"android-theme-"+theme);
            }
            assertEquals("true",evaluate(app,"(()=>{const b=QuietShelfApp.backup();return b.format==='quiet-shelf-backup'&&b.version===2&&b.preferences.autoUpdateChecks===false&&QuietShelfApp.readBackup(b).library[0].history.length===1})()"));
            app.recreate();ready(app);
            assertEquals("true",evaluate(app,"QuietShelfApp.snapshot().library.length===1&&QuietShelfApp.snapshot().library[0].history.length===1&&QuietShelfApp.backup().preferences.theme==='apricot'&&QuietShelfApp.backup().preferences.autoUpdateChecks===false"));
            assertEquals("true",evaluate(app,"(()=>{document.querySelector('#accountButton').click();return !document.querySelector('#accountPage').hidden&&!document.querySelector('#autoUpdateChecks').checked})()"));
            screenshot(app,"android-account");
            app.onActivity(activity->{int[] position=new int[2];activity.web.getLocationOnScreen(position);androidx.core.graphics.Insets bars=androidx.core.view.ViewCompat.getRootWindowInsets(activity.web).getInsets(androidx.core.view.WindowInsetsCompat.Type.systemBars());assertTrue("App content overlaps the status bar",position[1]>=bars.top);assertTrue("App content overlaps navigation controls",position[1]+activity.web.getHeight()<=activity.getWindow().getDecorView().getHeight()-bars.bottom);});
            // Probe the actual native message boundary without granting a real account.
            evaluate(app,"window.__androidProbe='waiting';QuietShelfAndroid.rpc('account.status').then(s=>window.__androidProbe=s.mode==='android'&&!JSON.stringify(s).includes('access_token')?'passed':'failed');true");
            for(int i=0;i<50&&!"\"passed\"".equals(evaluate(app,"window.__androidProbe"));i++)Thread.sleep(100);
            assertEquals("\"passed\"",evaluate(app,"window.__androidProbe"));
            evaluate(app,"window.__blockedProbe='waiting';QuietShelfAndroid.rpc('http',{url:'https://example.com/private',method:'GET',headers:{},body:null}).then(()=>window.__blockedProbe='failed').catch(()=>window.__blockedProbe='passed');true");
            for(int i=0;i<50&&!"\"passed\"".equals(evaluate(app,"window.__blockedProbe"));i++)Thread.sleep(100);
            assertEquals("\"passed\"",evaluate(app,"window.__blockedProbe"));
            app.onActivity(activity->{assertFalse(activity.web.getSettings().getAllowFileAccess());assertFalse(activity.web.getSettings().getAllowContentAccess());assertEquals(android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW,activity.web.getSettings().getMixedContentMode());});
        }
        PackageInfo info=InstrumentationRegistry.getInstrumentation().getTargetContext().getPackageManager().getPackageInfo("com.quietshelf.android",android.content.pm.PackageManager.GET_PERMISSIONS);
        for(String unwanted:new String[]{Manifest.permission.READ_CONTACTS,Manifest.permission.GET_ACCOUNTS,Manifest.permission.READ_EXTERNAL_STORAGE,Manifest.permission.WRITE_EXTERNAL_STORAGE,Manifest.permission.CAMERA,Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.RECORD_AUDIO})assertFalse(Arrays.asList(info.requestedPermissions).contains(unwanted));
    }
}
