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
            assertEquals("true",evaluate(app,"document.querySelector('#projectLicense').textContent.includes('TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION')&&document.querySelector('#projectNotice').textContent.includes('Copyright 2026 Alex (Ayca Kaygusuz)')&&document.querySelector('#fontLicense').textContent.includes('SIL OPEN FONT LICENSE')&&document.querySelector('#aboutQuietShelf').textContent.includes('Originally created by Alex (Ayca Kaygusuz).')"));
            app.onActivity(activity->{int[] position=new int[2];activity.web.getLocationOnScreen(position);androidx.core.graphics.Insets bars=androidx.core.view.ViewCompat.getRootWindowInsets(activity.web).getInsets(androidx.core.view.WindowInsetsCompat.Type.systemBars());assertTrue("App content overlaps the status bar",position[1]>=bars.top);assertTrue("App content overlaps navigation controls",position[1]+activity.web.getHeight()<=activity.getWindow().getDecorView().getHeight()-bars.bottom);});
            // Probe the actual native message boundary without granting a real account.
            evaluate(app,"window.__androidProbe='waiting';QuietShelfAndroid.rpc('account.status').then(s=>window.__androidProbe=s.mode==='android'&&!JSON.stringify(s).includes('access_token')?'passed':'failed');true");
            for(int i=0;i<50&&!"\"passed\"".equals(evaluate(app,"window.__androidProbe"));i++)Thread.sleep(100);
            assertEquals("\"passed\"",evaluate(app,"window.__androidProbe"));
            evaluate(app,"window.__blockedProbe='waiting';QuietShelfAndroid.rpc('http',{url:'https://example.com/private',method:'GET',headers:{},body:null}).then(()=>window.__blockedProbe='failed').catch(()=>window.__blockedProbe='passed');true");
            for(int i=0;i<50&&!"\"passed\"".equals(evaluate(app,"window.__blockedProbe"));i++)Thread.sleep(100);
            assertEquals("\"passed\"",evaluate(app,"window.__blockedProbe"));
            assertEquals("true",evaluate(app,"(()=>{QuietShelfApp.apply({library:Array.from({length:20},(_,i)=>({id:'next-qa-'+i,title:'Android checklist story '+i+' — standalone',author:'Library author',status:'Unread',history:[]})),preferences:{theme:'ink',autoUpdateChecks:false}});document.querySelector('#backToLibrary').click();document.querySelector('#readNextPanel').open=true;document.querySelector('#nextGenerate').click();window.__savedList=JSON.stringify(readNextState.list);selected=readNextState.list.entries[0].bookId;setStatus('In progress');selected=readNextState.list.entries[1].bookId;setStatus('Done');return document.querySelectorAll('.next-entry').length===12&&document.querySelectorAll('.next-done').length===1&&document.querySelectorAll('.next-active').length===1&&JSON.stringify(readNextState.list)===window.__savedList})()"));
            assertEquals("true",evaluate(app,"(()=>{document.querySelector('[data-next-book]').click();return document.body.classList.contains('android-detail-open')&&QuietShelfAndroid.back()})()"));
            screenshot(app,"android-read-next");
            app.recreate();ready(app);
            assertEquals("true",evaluate(app,"readNextState.list.entries.length===12&&QuietShelfApp.backup().preferences.readNext.list.id===readNextState.list.id"));
            assertEquals("true",evaluate(app,"(()=>{const b=(id,title,seriesName,volume)=>({id,title,status:'Unread',history:[],...(seriesName?{seriesMode:'manual',seriesName,seriesVolume:volume}:{})});QuietShelfApp.apply({library:[b('alpha-z','Zulu story','Alpha collection',2),b('alpha-y','Zed story','Alpha collection',1),b('zulu-a','Able story','Zulu collection',1),b('zulu-b','Adam story','Zulu collection',2),b('solo','Middle standalone')],preferences:{sort:'titleAsc',autoUpdateChecks:false}});const groups=[...document.querySelectorAll('.series-heading strong')].map(e=>e.textContent);document.querySelector('#showSeries').click();const onlySolo=visibleBooks().length===1;document.querySelector('#showStandalones').click();document.querySelector('#plainList').click();return groups.join(',')==='Alpha collection,Zulu collection'&&onlySolo&&document.querySelectorAll('#list .titlebutton').length===5&&document.querySelectorAll('.series-heading').length===0})()"));
            app.recreate();ready(app);
            assertEquals("true",evaluate(app,"libraryView.flat===true&&visibleBooks().length===5&&document.querySelector('#showSeries').disabled&&QuietShelfApp.backup().preferences.libraryView.flat===true"));
            app.onActivity(activity->{assertFalse(activity.web.getSettings().getAllowFileAccess());assertFalse(activity.web.getSettings().getAllowContentAccess());assertEquals(android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW,activity.web.getSettings().getMixedContentMode());});
        }
        PackageInfo info=InstrumentationRegistry.getInstrumentation().getTargetContext().getPackageManager().getPackageInfo("com.quietshelf.android",android.content.pm.PackageManager.GET_PERMISSIONS);
        for(String unwanted:new String[]{Manifest.permission.READ_CONTACTS,Manifest.permission.GET_ACCOUNTS,Manifest.permission.READ_EXTERNAL_STORAGE,Manifest.permission.WRITE_EXTERNAL_STORAGE,Manifest.permission.CAMERA,Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.RECORD_AUDIO})assertFalse(Arrays.asList(info.requestedPermissions).contains(unwanted));
    }
}
